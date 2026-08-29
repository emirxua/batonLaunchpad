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

  const handleBoostCoin = (mint: string) => {
    setSelectedCoin({
      id: `callout-${mint}`,
      name: mint.slice(0, 8),
      ticker: "?",
      mintAddress: mint,
      iconColor: "#f97316",
      marketCap: 0,
      volume24h: 0,
      change24h: 0,
      sparkline: [],
      totalBurnedBaton: 0,
      burnLevel: "none",
    });
  };

  const handleBurnSuccess = (coinId: string, burnedAmount: number) => {
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <Ticker />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono">
            Tracked Pump.fun Callouts
          </h1>
          <p className="text-sm text-zinc-500 font-mono max-w-2xl">
            Watchlist only — curated by this site, not the official Pump.fun rewards
            leaderboard. Daily USDC payouts are not public.
          </p>
        </div>

        {/* Live callout stream */}
        <LiveCallouts onBoostCoin={handleBoostCoin} />
      </main>

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
