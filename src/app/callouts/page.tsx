"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Ticker } from "@/components/Ticker";
import { LiveCallouts } from "@/components/callouts/LiveCallouts";
import { BurnModal } from "@/components/BurnModal";
import { Coin } from "@/types/coin";
import confetti from "canvas-confetti";

export default function CalloutsPage() {
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  const handleBoostCoin = (mint: string, name: string, symbol: string) => {
    setSelectedCoin({
      id: `callout-${mint}`,
      name,
      ticker: symbol,
      mintAddress: mint,
      iconColor: "#f97316",
      marketCap: 50000,
      volume24h: 10000,
      change24h: 0,
      sparkline: [10, 12, 14, 13, 16, 18, 20],
      totalBurnedBaton: 0,
      burnLevel: "none",
    });
  };

  const handleBurnSuccess = (coinId: string, burnedAmount: number) => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignored
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-lime-500/30 selection:text-lime-300">
      <Navbar />
      <Ticker />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-400 font-mono text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <span>Pump.fun Native Callout Engine &amp; Caller Yield Multipliers</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-archivo">
              Live Pump.fun Alpha Callouts
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans">
              Real-time push notifications from verified callers on Pump.fun. Track caller accuracy, multiplier performance from call timestamp, and burn $BATON to outbid &amp; boost callouts.
            </p>
          </div>
        </div>

        {/* Live Callouts Feed Component with SWR Polling */}
        <LiveCallouts onBoostCoin={handleBoostCoin} />
      </main>

      {/* Burn & Boost Modal */}
      {selectedCoin && (
        <BurnModal
          coin={selectedCoin}
          isOpen={!!selectedCoin}
          onClose={() => setSelectedCoin(null)}
          onSuccess={handleBurnSuccess}
        />
      )}
    </div>
  );
}
