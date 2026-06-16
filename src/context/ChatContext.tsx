/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import { getKeys } from '@/lib/storage';
import { decryptMessage, importPublicKey, encryptMessage } from '@/lib/crypto';
import { api } from '@/lib';
import { db } from '@/lib/db';
import { useSocket } from '@/hooks/useSocket';
import type { RawMessage, ConversationSummary, DecryptedMessage } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface ChatContextType {
  messages: DecryptedMessage[];
  conversations: ConversationSummary[];
  myKeys: CryptoKeyPair | null;
  activeContact: string | null;
  setActiveContact: (id: string | null) => void;
  sendMessage: (text: string, overrideContent?: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  ready: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [myKeys, setMyKeys] = useState<CryptoKeyPair | null>(null);
  const [activeContact, _setActiveContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const myUserId = useRef<string | null>(null);
  const activeContactRef = useRef<string | null>(null);

  const setActiveContact = (id: string | null) => {
    activeContactRef.current = id;
    _setActiveContact(id);
  };

  const init = useCallback(async () => {
    if (!user) {
      setReady(false);
      setMyKeys(null);
      return;
    }
    try {
      const keys = await getKeys();
      setMyKeys(keys);
      myUserId.current = String(user.id);
      setReady(true);
      loadConversations();
    } catch (err) {
      setReady(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
  }, [init]);

  async function loadConversations() {
    try {
      const data = await api.messages.listConversations();
      setConversations(data);
    } catch (err) {}
  }

  const processIncomingRaw = useCallback(async (msg: RawMessage): Promise<DecryptedMessage | null> => {
    if (!myKeys || !myUserId.current) return null;

    const isMe = String(msg.from_user_id) === String(myUserId.current);
    const targetKey = isMe ? msg.payload.encryptedKeyForSelf : msg.payload.encryptedKey;

    try {
      const content = await decryptMessage(
        { ciphertext: msg.payload.ciphertext, encryptedKey: targetKey, iv: msg.payload.iv },
        myKeys.privateKey
      );

      return {
        id: msg.id,
        sender: msg.from_user_id,
        recipient: msg.to_user_id,
        content,
        status: 'sent',
        timestamp: msg.created_at,
        isSecure: true,
        displaySender: isMe ? 'me' : 'them',
      };
    } catch {
      return {
        id: msg.id,
        status: 'sent',
        sender: msg.from_user_id,
        recipient: msg.to_user_id,
        content: '[Encrypted Message]',
        timestamp: msg.created_at,
        isSecure: false,
        displaySender: isMe ? 'me' : 'them',
      };
    }
  }, [myKeys]);

  const refreshMessages = useCallback(async () => {
    if (!activeContact || !myKeys || !myUserId.current || !ready) return;

    try {
      setHasMore(true);
      setLoading(true);

      const localCache = await db.messages
        .where('chatPartnerId')
        .equals(activeContact)
        .sortBy('timestamp');

      setMessages(localCache);

      const lastMsg = localCache.length > 0 ? localCache[localCache.length - 1] : null;
      const since = lastMsg ? lastMsg.timestamp : undefined;

      const newRawMessages = await api.messages.getHistory(activeContact, 50, undefined, since);

      if (newRawMessages.length > 0) {
        const decrypted = await Promise.all(newRawMessages.map(processIncomingRaw));
        const valid = decrypted.filter((m): m is DecryptedMessage => m !== null);

        await db.messages.bulkPut(
          valid.map(m => ({ ...m, chatPartnerId: activeContact }))
        );

        setMessages((prev) => {
          const merged = [...prev, ...valid];
          const unique = Array.from(new Map(merged.map((m) => [m.id, m])).values());
          return unique.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        });
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [activeContact, myKeys, ready, processIncomingRaw]);

  const { sendWsMessage } = useSocket({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMessageReceive: useCallback((data: any) => {
      const raw = data as RawMessage;

      processIncomingRaw(raw).then(async (result) => {
        if (result) {
          const partnerId = result.displaySender === 'me' ? result.recipient : result.sender;

          await db.messages.put({ ...result, chatPartnerId: partnerId });

          if (String(activeContactRef.current) === String(partnerId)) {
            setMessages((prev) => {
              const exactIdExists = prev.some((m) => m.id === result.id);
              if (exactIdExists) return prev;

              const optimisticMatch = prev.find(
                (m) => m.displaySender === 'me' && m.status === 'sending' && m.content === result.content
              );

              if (optimisticMatch) {
                return prev.map((m) => (m.id === optimisticMatch.id ? result : m));
              }

              const updated = [...prev, result];
              return updated.sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
            });
          }
          loadConversations();
        }
      });
    }, [processIncomingRaw]),

    onUserStatus: useCallback((data: { event: string; user_id: string }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.user_id === data.user_id
            ? { ...conv, is_online: data.event === 'user.online' }
            : conv
        )
      );
    }, []),
  });

  async function loadMoreMessages() {
    if (!activeContact || !myKeys || !hasMore || loading) return;
    try {
      const oldestMsg = messages[0];
      const beforeTimestamp = oldestMsg ? oldestMsg.timestamp : undefined;
      const history = await api.messages.getHistory(activeContact, 50, beforeTimestamp);

      if (history.length === 0) {
        setHasMore(false);
        return;
      }

      const decrypted = await Promise.all(history.map(processIncomingRaw));
      const filtered = decrypted.filter((m): m is DecryptedMessage => m !== null);

      await db.messages.bulkPut(filtered.map(m => ({ ...m, chatPartnerId: activeContact })));

      setMessages((prev) => {
        const merged = [...filtered, ...prev];
        const unique = Array.from(new Map(merged.map(m => [m.id, m])).values());
        return unique.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });

      if (history.length < 50) setHasMore(false);
    } catch (err) {}
  }

  const sendMessage = async (text: string, overrideContent?: string) => {
    const finalContent = overrideContent || text;
    if (!activeContact || !finalContent.trim() || !myKeys || !myUserId.current) return;

    const tempId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const tempMsg: DecryptedMessage = {
      id: tempId,
      sender: myUserId.current!,
      recipient: activeContact,
      content: finalContent,
      timestamp: timestamp,
      isSecure: true,
      displaySender: 'me',
      status: 'sending',
    };

    try {
      // Optimistic update (UI only, no DB)
      setMessages((prev) => [...prev, tempMsg]);

      if (!navigator.onLine) {
        toast.error("Offline. Message not sent.");
        setMessages((prev) => prev.filter(m => m.id !== tempId));
        return;
      }

      const res = await api.users.getPublicKey(activeContact);
      const pubKey = typeof res === 'string' ? res : res?.public_key;

      if (!pubKey || pubKey.length < 100) throw new Error("Encryption error");

      const recipientKey = await importPublicKey(pubKey);
      const encryptedPackage = await encryptMessage(finalContent, recipientKey, myKeys.publicKey);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const success = sendWsMessage(activeContact, encryptedPackage as any);
      if (!success) {
        await api.messages.send(activeContact, encryptedPackage);
      }
      
      loadConversations();
    } catch (err) {
      toast.error('Failed to send');
      setMessages((prev) => prev.filter(m => m.id !== tempId));
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready && activeContact) refreshMessages();
  }, [activeContact, ready, refreshMessages]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        conversations,
        myKeys,
        activeContact,
        setActiveContact,
        sendMessage,
        refreshMessages,
        loadConversations,
        loadMoreMessages,
        hasMore,
        loading,
        ready,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat error');
  return ctx;
};