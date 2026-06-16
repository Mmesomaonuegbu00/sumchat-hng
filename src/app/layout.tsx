import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";
import CanvasRain from "@/component/shared/Canvas";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  variable: "--font-league",
});

export const metadata: Metadata = {
  title: "SumChat | Secure Messaging",
  description: "End-to-End Encrypted Communication for the Modern Web",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${leagueSpartan.variable} h-full`}
      >
        <AuthProvider>
          <ChatProvider>
            
            {/* ✅ Global Background Wrapper */}
            <div className="app-bg text-white">
              <CanvasRain />

              <div className="app-content flex flex-col min-h-screen">
                {children}
              </div>
            </div>

            <Toaster position="top-right" />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}