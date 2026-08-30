"use client";

import React from "react";
import { useMarketStats } from "@/hooks/useMarketData";
import { Flame, Zap } from "lucide-react";

export const Ticker: React.FC = React.memo(() => {
  const { markets, isLoading } = useMarketStats();

  return (
    <div className="w-full bg-zinc-100 dark:bg-[#07080A] text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-white/10 h-8 flex items-center overflow-hidden select-none z-50 relative font-mono text-[11px] font-bold">
      {/* ── Left Indicator: Green Live Terminal Pulsating Dot ──────────── */}
      <div className="flex items-center gap-2 px-3 h-full bg-white dark:bg-black text-zinc-900 dark:text-white uppercase tracking-wider text-[10px] font-black z-10 shrink-0 border-r border-zinc-200 dark:border-white/10">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
        </span>
        <span className="hidden sm:inline">LIVE TERMINAL</span>
      </div>

      {/* ── Left Fuel Badge: Ecosystem Fuel: $BATON Burn-to-Rank ─────────── */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 h-full bg-amber-500/10 text-amber-500 dark:text-amber-400 uppercase tracking-wider text-[10px] font-bold z-10 shrink-0 border-r border-zinc-200 dark:border-white/10">
        <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
        <span>Ecosystem Fuel: $BATON Burn-to-Rank</span>
      </div>

      {/* ── Continuous Marquee Feed ──────────────────────────────────────── */}
      <div className="flex overflow-hidden w-full group">
        {markets.length === 0 ? (
          <div className="px-4 text-xs text-zinc-500 flex items-center gap-2 animate-pulse">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Connecting to live Solana &amp; Crypto price streams…</span>
          </div>
        ) : (
          <div className="animate-marquee-gpu items-center flex">
            {/* Loop 1 */}
            {markets.map((m) => (
              <div key={`m1-${m.symbol}`} className="flex items-center gap-1.5 px-4 whitespace-nowrap">
                <span className="text-zinc-500 uppercase text-[10px]">{m.symbol}/USD:</span>
                <span className="font-black text-zinc-950 dark:text-zinc-100">{m.priceFormatted}</span>
                <span
                  className={`text-[10px] px-1 py-0.5 rounded font-bold ${
                    m.isPositive
                      ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-rose-500 bg-rose-500/10 border border-rose-500/20"
                  }`}
                >
                  {m.changeFormatted}
                </span>
                <span className="text-zinc-400 dark:text-zinc-700 ml-2">/</span>
              </div>
            ))}

            {/* Loop 2 */}
            {markets.map((m) => (
              <div key={`m2-${m.symbol}`} className="flex items-center gap-1.5 px-4 whitespace-nowrap">
                <span className="text-zinc-500 uppercase text-[10px]">{m.symbol}/USD:</span>
                <span className="font-black text-zinc-950 dark:text-zinc-100">{m.priceFormatted}</span>
                <span
                  className={`text-[10px] px-1 py-0.5 rounded font-bold ${
                    m.isPositive
                      ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-rose-500 bg-rose-500/10 border border-rose-500/20"
                  }`}
                >
                  {m.changeFormatted}
                </span>
                <span className="text-zinc-400 dark:text-zinc-700 ml-2">/</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

Ticker.displayName = "Ticker";

export default Ticker;
