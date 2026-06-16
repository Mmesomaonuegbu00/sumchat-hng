'use client';

import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  error: string | null;
  isNewlyRegistered: boolean;
}

export default function LoginForm({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  loading,
  error,
  isNewlyRegistered,
}: LoginFormProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      
      <div className="w-full max-w-md">
        <div className="border border-slate-800 bg-slate-950/30 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <p className="font-mono text-[10px] text-orange-500 tracking-[0.2em] uppercase">
                SumChat
              </p>
            </div>

            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Login to continue chatting
            </p>
          </div>

          {/* Success */}
          {isNewlyRegistered && !error && (
            <div className="mb-5 bg-yellow-900/20 border border-yellow-700/40 text-yellow-300 p-3.5 rounded-xl flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p>Account created. You can login now.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-950/40 border border-red-900/50 text-red-400 p-3.5 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">
                Username
              </label>
              <input
                required
                value={username}
                placeholder="your_username"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-yellow-500/50 rounded-xl outline-none transition-all text-white text-sm placeholder:text-slate-600"
                onChange={e => onUsernameChange(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <input
                required
                type="password"
                value={password}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-800 focus:border-yellow-500/50 rounded-xl outline-none transition-all text-white text-sm placeholder:text-slate-600"
                onChange={e => onPasswordChange(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 text-black font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              Don’t have an account?{' '}
              <Link
                href="/register"
                className="text-orange-600 hover:text-orange-400 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}