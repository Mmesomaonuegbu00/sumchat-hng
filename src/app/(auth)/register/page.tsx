'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { prepareRegistration } from '@/lib/crypto';
import { saveKeys } from '@/lib/storage';
import { api } from '@/lib';
import RegisterForm from '@/component/auth/Register';

interface FormData {
  username: string;
  display_name: string;
  password: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    display_name: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Generate RSA keypair + wrap private key with password
      const { publicKey, wrappedPrivateKey, pbkdf2Salt, rawKeys } =
        await prepareRegistration(formData.password);

      // 2. Register on server (also saves unwrapped keys to IndexedDB via api.auth)
      await api.auth.register({
        username: formData.username,
        display_name: formData.display_name,
        password: formData.password,
        public_key: publicKey,
        wrapped_private_key: wrappedPrivateKey,
        pbkdf2_salt: pbkdf2Salt,
      });

      // 3. Also persist the raw (already-unwrapped) keys from this session
      //    so the user doesn't have to re-derive on their first action
      await saveKeys(rawKeys);

      router.push('/login?registered=true');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterForm
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  );
}