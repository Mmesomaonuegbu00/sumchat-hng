'use client';

import { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import ChatWindow from '@/component/dashboard/Chat';

export default function ChatPage() {
  const { messages, activeContact, setActiveContact, sendMessage } = useChat();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(text);
      setText('');
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectUser = (user: { id: string; username: string; display_name: string }) => {
    setActiveContact(user.id);
  };

  const handleBack = () => setActiveContact(null);

  const normalizedMessages = messages.map((message) => ({
    ...message,
    id: message.id ?? '',
  }));

  return (
    <ChatWindow
      messages={normalizedMessages}
      onBack={handleBack}
      activeContact={activeContact}
      text={text}
      isSending={isSending}
      onTextChange={setText}
      onSubmit={handleSubmit}
      onSelectUser={handleSelectUser}
    />
  );
}