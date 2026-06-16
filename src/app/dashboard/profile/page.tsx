'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser, loading } = useAuth();
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.display_name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('whisper_token');
    setUser(null);
    router.push('/login');
  };

  const saveProfile = async () => {
    if (!newName.trim()) return;
    try {
      setIsSaving(true);
      const updatedUser = await api.auth.updateMe({ display_name: newName });
      setUser(updatedUser); // Update global context
      setIsEditing(false);
      toast.success('Identity synchronized');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-xs">Loading...</div>;
  if (!user) return <div className="min-h-screen bg-slate-950/40 flex items-center justify-center text-slate-500 text-xs">Unauthorized access</div>;

  return (
    <div className="min-h-screen bg-slate-950/40 text-white px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-xs text-slate-400 hover:text-orange-400 transition">← Back</button>
        <p className="text-[10px] text-slate-600 uppercase tracking-widest">Profile Configuration</p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Avatar & Interactive Name */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-2xl bg-orange-600/10 border border-orange-600/30 flex items-center justify-center text-orange-500 text-3xl font-bold shadow-2xl shadow-orange-900/20">
            {user.display_name?.[0] || "U"}
          </div>

          <div className="mt-5 text-center">
            {isEditing ? (
              <div className="flex flex-col items-center gap-2">
                <input 
                  autoFocus
                  className="bg-slate-900 border border-orange-500/50 rounded-lg px-4 py-2 text-center text-xl focus:outline-none"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={saveProfile} disabled={isSaving} className="text-[10px] text-orange-500 uppercase font-bold tracking-tighter disabled:opacity-50">Save</button>
                  <button onClick={() => setIsEditing(false)} className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  {user.display_name}
                  <button onClick={() => setIsEditing(true)} className="text-[10px] text-slate-600 hover:text-slate-400">Edit</button>
                </h1>
                <p className="text-orange-500 text-sm">@{user.username}</p>
              </>
            )}
          </div>
        </div>

        {/* Data Cards */}
        <div className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Unique Identifier</p>
            <p className="text-xs text-slate-300 break-all mt-1 font-mono">{user.id}</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Network Status</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <p className="text-xs text-orange-400">Active Presence</p>
            </div>
          </div>
        </div>

        {/* Action Zone */}
        <div className="mt-10">
          <button 
            onClick={handleLogout}
            className="w-full py-3 rounded-xl border border-red-900/40 text-red-400 hover:bg-red-950/30 transition text-xs uppercase tracking-widest"
          >
            Terminate Session
          </button>
        </div>
      </div>
    </div>
  );
}