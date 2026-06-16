'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@/context/ChatContext';
import UserSearch from '../shared/Search'; 
import { MessageSquareCode, Circle } from 'lucide-react';

export default function ConversationsSidebar() {
  const { 
    conversations, 
    setActiveContact, 
    activeContact, 
    messages, 
    loadConversations 
  } = useChat();

  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (messages.length === 0) return;

    const latestMsg = messages[messages.length - 1];

    // Only mark as unread if the message is truly new (sent within the last 10 seconds)
    // and belongs to someone else who isn't the current active chat.
    const isRecent = new Date().getTime() - new Date(latestMsg.timestamp).getTime() < 10000;

    if (
      latestMsg.displaySender === 'them' && 
      latestMsg.sender !== activeContact && 
      isRecent
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadIds(prev => new Set(prev).add(latestMsg.sender));
    }
    
    loadConversations();
  }, [messages, activeContact, loadConversations]);

  const handleSelect = (userId: string) => {
    setActiveContact(userId);
    setUnreadIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  return (
    <aside className={`${activeContact ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 h-full border-r border-slate-800 bg-slate-950/50`}>
      
      <div className="p-4 border-b border-slate-800 space-y-4 bg-slate-950/40">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <MessageSquareCode className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase">SumChat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-[10px] text-slate-500 font-medium">LIVE</span>
          </div>
        </div>
        <UserSearch onSelectUser={(user) => handleSelect(user.id)} />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-0">
        {conversations.length === 0 ? (
          <div className="p-12 text-center text-slate-600 text-[10px] uppercase tracking-widest font-bold">
            No chats yet
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = activeContact === c.user_id;
            const isUnread = unreadIds.has(c.user_id);

            return (
              <div
                key={c.user_id}
                onClick={() => handleSelect(c.user_id)}
                className={`p-4 cursor-pointer border-b border-slate-900/30 transition-all relative group ${
                  isActive ? 'bg-slate-900/80' : 'hover:bg-slate-900/40'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600 shadow-[2px_0_12px_rgba(234,88,12,0.4)]" />
                )}

                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${isActive ? 'text-orange-500' : 'text-slate-300'}`}>
                      {c.display_name}
                    </p>
                    {isUnread && !isActive && (
                      <Circle className="w-2 h-2 fill-orange-500 text-orange-500 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-slate-600">
                    {c.last_message_at 
                      ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : ''
                    }
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate italic">@{c.username}</p>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}