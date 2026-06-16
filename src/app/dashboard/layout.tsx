'use client';

import dynamic from 'next/dynamic';
import { useChat } from "@/context/ChatContext";

// Force these to be Client-Side ONLY
const Sidebar = dynamic(() => import("@/component/dashboard/Sidebar"), { ssr: false });
const ConversationsSidebar = dynamic(() => import("@/component/dashboard/ConversationSidebar"), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { activeContact } = useChat();

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-black">
      {/* Sidebar will now only render on the client */}
      <Sidebar />

      <div className="flex flex-1 h-full overflow-hidden">
        {/* The width/visibility logic won't conflict with the server anymore */}
        <div className={`${activeContact ? 'hidden md:flex' : 'flex'} w-full md:w-80 shrink-0`}>
          <ConversationsSidebar />
        </div>

        <main className={`${!activeContact ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 relative`}>
          {children}
        </main>
      </div>
    </div>
  );
}