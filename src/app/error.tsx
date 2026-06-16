'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);

    toast.error(
      error?.message || 'Something went wrong. Please try again.'
    );
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white px-6 text-center">
      <div className="max-w-md">
        <h2 className="text-lg font-bold mb-2">Something went wrong</h2>

        <p className="text-slate-500 text-sm mb-6">
          The app ran into an unexpected issue. You can retry or continue using other parts.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-sm font-medium"
          >
            Retry
          </button>

          <button
            onClick={() => (window.location.href = '/dashboard/chat')}
            className="px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-900"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}