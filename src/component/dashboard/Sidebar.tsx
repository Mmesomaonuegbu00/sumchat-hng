'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { MessageSquare, User, LogOut, ShieldCheck, ShieldAlert } from 'lucide-react';
import { api } from '@/lib';

const navItems = [
  { name: 'Messages', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { myKeys } = useChat();

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      // Optionally redirect or reload here
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside className="
      fixed bottom-0 left-0 right-0 h-16 w-full border-t 
      md:relative md:h-screen md:w-16 md:border-t-0 md:border-r 
      border-slate-800 flex flex-row md:flex-col 
      bg-slate-950/80 backdrop-blur-md items-center justify-between md:justify-start py-0 md:py-6 px-6 md:px-0 z-50
    ">
      
      {/* Brand / Logo - Only visible on Desktop */}
      <div className="hidden md:flex mb-8">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">SU</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-row md:flex-col items-center gap-8 md:gap-4 flex-1 justify-center md:justify-start">
        {navItems.map(({ name, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);

          return (
            <div key={name} className="relative group">
              <Link
                href={href}
                className={`w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-2xl md:rounded-xl transition-all ${
                  isActive
                    ? 'bg-orange-600/20 text-orange-500'
                    : 'text-slate-500 hover:bg-slate-900 hover:text-orange-400'
                }`}
              >
                <Icon className="w-6 h-6 md:w-5 md:h-5" />
                
                {/* Active Indicator Dot (Mobile) */}
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full md:hidden" />
                )}
              </Link>

              {/* Tooltip (Desktop Only) */}
              <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-slate-700 shadow-xl">
                {name}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Actions (Status & Logout) */}
      <div className="flex flex-row md:flex-col items-center gap-6 md:gap-4 md:mt-auto md:pb-4">
        
        {/* Secure Session Indicator */}
        <div className="relative group cursor-help">
          <div className="p-2">
            {myKeys ? (
               <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
            ) : (
               <ShieldAlert className="w-5 h-5 text-red-500" />
            )}
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-14 md:bottom-auto md:left-14 md:top-1/2 md:-translate-y-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-slate-700">
            {myKeys ? 'Encrypted Session' : 'Unsecured'}
          </div>
        </div>

        {/* Logout Button */}
        <div className="relative group">
          <button
            onClick={handleLogout}
            className="w-12 h-12 md:w-10 md:h-10 flex items-center justify-center rounded-2xl md:rounded-xl text-slate-500 hover:bg-red-950/30 hover:text-red-400 transition-all"
          >
            <LogOut className="w-6 h-6 md:w-5 md:h-5" />
          </button>

          {/* Tooltip */}
          <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-slate-700">
            Logout
          </div>
        </div>
      </div>
    </aside>
  );
}