"use client";

import React, { useState, useEffect } from "react";

export function SiteIntroSplash() {
  const [fading, setFading] = useState(false);
  const [destroyed, setDestroyed] = useState(false);

  useEffect(() => {
    let dismissed = false;

    // Ultra-snappy intro: starts dissolving at ~170ms so there is virtually zero waiting
    const minTimePromise = new Promise((resolve) => setTimeout(resolve, 170));

    // Data ready listener with fast safety cap (300ms)
    const dataLoadedPromise = new Promise((resolve) => {
      const handleData = () => resolve(true);
      window.addEventListener("outbid:data-loaded", handleData, { once: true });
      setTimeout(resolve, 300);
    });

    Promise.all([minTimePromise, dataLoadedPromise]).then(() => {
      if (dismissed) return;
      setFading(true);
      setTimeout(() => {
        setDestroyed(true);
      }, 160);
    });

    return () => {
      dismissed = true;
    };
  }, []);

  const handleInstantDismiss = () => {
    setFading(true);
    setTimeout(() => setDestroyed(true), 80);
  };

  if (destroyed) return null;

  return (
    <div
      id="outbid-intro-splash"
      onClick={handleInstantDismiss}
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none font-mono cursor-pointer transition-opacity duration-150 ease-out bg-white dark:bg-[#0B0E14] ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* ── Minimalist Clean Centered Brand Content (Zero giant orange puddles or wide flares) ── */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6">
        {/* Outbid 3-Stripe Monogram (Crisp, Compact, Razor-Sharp Luxury Finish) */}
        <div className="relative flex flex-col gap-1.5 w-14 sm:w-16 h-11 sm:h-12 justify-center items-center">
          {/* Subtle tiny accent glow behind emblem only */}
          <div className="absolute w-8 h-8 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />

          {/* Stripe 1 (Top) */}
          <span className="w-full h-1.5 sm:h-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-sm" />
          {/* Stripe 2 (Middle - Equal) */}
          <span className="w-full h-1.5 sm:h-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-sm" />
          {/* Stripe 3 (Bottom) */}
          <span className="w-full h-1.5 sm:h-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-sm" />
        </div>

        {/* Brand Typography */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[0.26em] font-mono text-zinc-950 dark:text-zinc-100">
            OUTBID
          </h1>
          <p className="text-[9px] sm:text-[10px] tracking-[0.32em] uppercase font-bold text-zinc-400 dark:text-zinc-500">
            SOLANA ALPHA ENGINE • TERMINAL V2
          </p>
        </div>

        {/* Minimal High-Speed Status Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-[9px] text-zinc-600 dark:text-zinc-400 font-mono shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-bold tracking-wider uppercase">INITIALIZING LIVE FEED</span>
        </div>
      </div>
    </div>
  );
}

export default SiteIntroSplash;
