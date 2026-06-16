'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white flex flex-col bg-gradient-to-b from-slate-950/20 via-black/70 to-slate-950/30 relative overflow-hidden">

      {/* Soft background blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl animate-pulse" />


      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-orange-500/50 rounded flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
            </svg>
          </div>
          <span className="font-mono text-sm tracking-[0.2em] text-orange-400 uppercase">
            SumChat
          </span>
        </div>

        <div className="font-mono text-[10px] text-slate-500 tracking-widest">
          Simple · Private · Fast
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10">

        {/* Tagline */}
        <div className="mb-6 inline-flex items-center gap-2 border border-orange-900/60 bg-orange-950/20 rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-orange-400/70 uppercase">
            Just conversations, nothing extra
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6"
          style={{ fontFamily: "'Georgia', serif", letterSpacing: '-0.03em' }}
        >
          <span className="text-white">Talk freely.</span>
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: 'linear-gradient(135deg, #fb923c, #f97316)',
            }}
          >
            Stay in your world.
          </span>
        </h1>

        {/* Subtext */}
        <p className="max-w-md text-slate-400 text-base leading-relaxed mb-8 font-light">
          A simple chat app for people who just want to talk — friends, teams, or anyone in between.
          No noise. No tracking. Just your messages, staying between you and the people you choose.
        </p>

        {/* Illustration */}
        <div className="w-[400px] h-[300px]">
          <Image
            src="/img.png" 
            width={300}
            height={300}
            alt="Chat illustration"
            className="w-64 mx-auto drop-shadow-lg"
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/register"
            className="px-8 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-black font-bold text-sm tracking-wide rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/30 hover:-translate-y-0.5 w-[250px]"
          >
            <button className="uppercase tracking-widest text-xs w-full">
              Get Started
            </button>
          </Link>

          <Link
            href="/login"
            className="px-8 py-2.5 w-[250px] border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-sm rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            <button className="font-mono uppercase tracking-widest text-xs w-full">
              Login
            </button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center z-10">
        <p className="font-mono text-[10px] text-slate-700 tracking-widest uppercase">
          Made for real conversations · not data collection
        </p>
      </footer>
    </div>
  );
}