'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, Loader2, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import type { DecryptedMessage } from '@/types';
import UserSearch from '../shared/Search';

interface UserSummary {
    id: string;
    username: string;
    display_name: string;
}

interface ChatWindowProps {
    messages: DecryptedMessage[];
    activeContact: string | null;
    onBack?: () => void;
    text: string;
    isSending: boolean;
    onTextChange: (value: string) => void;
    onSubmit: (e: React.FormEvent, overrideContent?: string) => Promise<void>;
    onSelectUser: (user: UserSummary) => void;
    contactDisplayName?: string;
}

function EmptyState({ onSelectUser }: { onSelectUser: (user: UserSummary) => void }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/50 text-center px-6">
            <h2 className="text-orange-600 font-bold text-lg mb-1">Start chatting</h2>
            <p className="text-slate-500 text-xs mb-6">Search a user to begin an encrypted chat</p>
            <div className="w-full max-w-xs">
                <UserSearch onSelectUser={onSelectUser} />
            </div>
        </div>
    );
}

export default function ChatWindow({
    messages,
    activeContact,
    text,
    isSending,
    onTextChange,
    onSubmit,
    onSelectUser,
    contactDisplayName,
    onBack,
}: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<{ name: string; data: string; type: string } | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.size > 1024 * 1024) {
            alert("File too large. Keep it under 1MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setFile({
                name: selectedFile.name,
                type: selectedFile.type,
                data: reader.result as string
            });
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() && !file) return;

        if (file) {
            const payload = JSON.stringify({
                text: text.trim(),
                file: file.data,
                fileName: file.name,
                fileType: file.type
            });
            await onSubmit(e, payload);
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
            await onSubmit(e);
        }
    };

    if (!activeContact) return <EmptyState onSelectUser={onSelectUser} />;

    return (
        <div className="flex flex-col h-full bg-slate-950/50 pb-16 relative">
            <header className="px-2 py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/50 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 text-orange-500">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div className="w-9 h-9 rounded-xl bg-orange-600/10 border border-orange-600/30 flex items-center justify-center text-orange-500 font-bold text-xs">
                        {(contactDisplayName || activeContact).slice(0, 2)}
                    </div>
                    <div>
                        <h2 className="text-white text-sm font-semibold">{contactDisplayName || activeContact.slice(0, 14)}</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                            <span className="text-[9px] text-orange-400/70 uppercase tracking-widest">Online</span>
                        </div>
                    </div>
                </div>
                <span className="text-[9px] text-slate-600 border border-slate-800 px-2.5 py-1 rounded-full uppercase tracking-widest">E2EE</span>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 space-y-4">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-xs text-slate-400">No messages yet. Say hello 👋</div>
                )}

                {messages.map((m, i) => {
                    let displayContent: React.ReactNode = m.content;

                    if (typeof m.content === 'string') {
                        try {
                            const parsed = JSON.parse(m.content);

                            if (parsed?.file) {
                                displayContent = (
                                    <div className="flex flex-col gap-2 min-w-50">
                                        {parsed.fileType?.startsWith('image/') ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={parsed.file}
                                                alt="upload"
                                                className="rounded-lg object-cover max-h-60 w-full border border-white/10"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 p-3 bg-black/30 rounded-xl border border-white/5">
                                                <FileText className="w-5 h-5 text-orange-500" />
                                                <span className="text-xs truncate">{parsed.fileName}</span>
                                            </div>
                                        )}
                                        {parsed.text && <p className="text-sm">{parsed.text}</p>}
                                    </div>
                                );
                            }
                        } catch {
                            displayContent = m.content;
                            console.log("Incoming message:", m.content);
                        }
                    }

                    return (
                        <div key={m.id ?? i} className={`flex ${m.displaySender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[75%]">
                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.displaySender === 'me' ? 'bg-orange-800 text-white rounded-tr-sm' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'}`}>
                                    {displayContent}
                                </div>
                                <div className={`mt-1 text-[9px] text-slate-600 flex items-center gap-1 ${m.displaySender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {m.isSecure && <span className="text-orange-300/50">• encrypted</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <form ref={formRef} onSubmit={handleFormSubmit} className="px-4 py-4 border-t border-slate-800/60 bg-slate-950 relative">
                {file && (
                    <div className="absolute -top-16 left-4 right-4 p-2 bg-slate-900 border border-orange-600/50 rounded-xl flex items-center justify-between shadow-2xl backdrop-blur-lg">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {file.type.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-orange-500" /> : <FileText className="w-4 h-4 text-orange-500" />}
                            <span className="text-[10px] text-slate-300 truncate font-medium">{file.name}</span>
                        </div>
                        <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-slate-800 rounded-full transition-colors"><X className="w-3 h-3 text-slate-500" /></button>
                    </div>
                )}

                <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 focus-within:border-orange-600/50 rounded-2xl px-4 transition-all">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-500 hover:text-orange-500 transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf,.doc,.docx,.txt" />
                    <input
                        value={text}
                        onChange={e => onTextChange(e.target.value)}
                        disabled={isSending}
                        placeholder={isSending ? 'Sending...' : 'Type a message...'}
                        className="flex-1 bg-transparent py-3 text-sm text-white placeholder:text-slate-700 outline-none"
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if ((text.trim() || file) && !isSending) formRef.current?.requestSubmit();
                            }
                        }}
                    />
                    <button type="submit" disabled={isSending || (!text.trim() && !file)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 transition-all">
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <span className="text-white text-sm">➤</span>}
                    </button>
                </div>
            </form>
        </div>
    );
}