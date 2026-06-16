'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginForm from '@/component/auth/Login';
import { api } from '@/lib';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNewlyRegistered = searchParams.get('registered') === 'true';

  // Fix: Reset error only if typing occurs while an error is present
  useEffect(() => {
    if (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
    }
  }, [username, password, error]); // removed the recursive set-state logic

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // api.auth.login handles: token storage + key unwrapping + IndexedDB save
      await api.auth.login(username.toLowerCase().trim(), password);

      // Force state refresh for Navbar/Auth wrappers
      window.dispatchEvent(new Event('auth-change'));

      router.push('/dashboard/chat');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      username={username}
      password={password}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      isNewlyRegistered={isNewlyRegistered}
    />
  );
}