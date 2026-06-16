'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib';
import type { UserProfile } from '@/types';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    setUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    setUser: () => { },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const token = localStorage.getItem('whisper_token');

            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const me = await api.auth.getMe();
                setUser(me);
            } catch (err) {
                console.error('Auth error:', err);
                localStorage.removeItem('whisper_token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        load();

        // 🔥 LISTEN FOR LOGIN EVENT
        const handleAuthChange = () => load();

        window.addEventListener('auth-change', handleAuthChange);

        return () => {
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}