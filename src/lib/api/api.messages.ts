import { BASE_URL, getAuthHeader, handleResponse } from '@/types/core';
import type { ConversationSummary, RawMessage, EncryptedPackage } from '@/types';

export const messagesApi = {
  listConversations: async (): Promise<ConversationSummary[]> => {
    const res = await fetch(`${BASE_URL}/conversations`, {
      headers: getAuthHeader(),
    });

    return handleResponse<ConversationSummary[]>(res, 'List Conversations');
  },

  getHistory: async (
    user_id: string, 
    limit = 50, 
    before?: string, 
    since?: string
  ): Promise<RawMessage[]> => {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    
    if (before) params.append('before', before);
    if (since) params.append('since', since);

    const res = await fetch(
      `${BASE_URL}/conversations/${user_id}/messages?${params.toString()}`,
      {
        headers: getAuthHeader(),
      }
    );

    return handleResponse<RawMessage[]>(res, 'Fetch History');
  },

  send: async (recipientId: string, encrypted: EncryptedPackage): Promise<RawMessage> => {
    const res = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        to: recipientId,
        payload: {
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          encryptedKey: encrypted.encryptedKey,
          encryptedKeyForSelf: encrypted.encryptedKeyForSelf,
        },
      }),
    });

    return handleResponse<RawMessage>(res, 'Send Message');
  },
};