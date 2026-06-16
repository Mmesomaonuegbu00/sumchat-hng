import { Suspense } from 'react';
import LoginClient from '../../../component/auth/Loginclient';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    }>
      <LoginClient />
    </Suspense>
  );
}