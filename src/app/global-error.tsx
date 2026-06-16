'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('GLOBAL ERROR:', error);

    toast.error(error?.message || 'Unexpected system error');
  }, [error]);

  return (
    <html>
      <body className="bg-slate-950 text-white flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-6">
          <h2 className="text-lg font-bold mb-2">
            Something broke in the app
          </h2>

          <p className="text-slate-500 text-sm mb-6">
            Don’t worry — your session is safe. You can retry.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-emerald-600 text-black rounded-lg text-sm"
            >
              Retry
            </button>

            <button
              onClick={() => (window.location.href = '/dashboard/chat')}
              className="px-4 py-2 border border-slate-700 rounded-lg text-sm"
            >
              Reload App
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}