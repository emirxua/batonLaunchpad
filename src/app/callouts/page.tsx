"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Navbar } from "@/components/Navbar";
import { Ticker } from "@/components/Ticker";
import { LiveCallouts } from "@/components/callouts/LiveCallouts";
import { TrackedLeaderboard } from "@/components/callouts/TrackedLeaderboard";
import { BurnModal } from "@/components/BurnModal";
import { CalloutsApiResponse } from "@/lib/types/callouts";
import { Coin } from "@/types/coin";
import confetti from "canvas-confetti";

const fetcher = (url: string): Promise<CalloutsApiResponse> =>
  fetch(url).then((r) => r.json());

export default function CalloutsPage() {
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Single SWR subscription — shared between both columns
  const { data, isLoading, isValidating, mutate } = useSWR<CalloutsApiResponse>(
    "/api/callouts",
    fetcher,
    { refreshInterval: 12_000, keepPreviousData: true }
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

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

  const handleBurnSuccess = () => {
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

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Page title ────────────────────────────────────────────── */}
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono">
            Tracked Pump.fun Callouts
          </h1>
          <p className="text-sm text-zinc-500 font-mono max-w-2xl">
            Watchlist only — curated by this site, not the official Pump.fun
            rewards leaderboard. Daily USDC payouts are not public.
          </p>
        </div>

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left: callout card stream */}
          <LiveCallouts
            data={data}
            isLoading={isLoading}
            isValidating={isValidating}
            mutate={mutate}
            copied={copied}
            onCopy={handleCopy}
            onBoostCoin={handleBoostCoin}
          />

          {/* Right: watchlist leaderboard (sticky) */}
          <div className="lg:sticky lg:top-[88px]">
            <TrackedLeaderboard
              data={data}
              isLoading={isLoading}
              copied={copied}
              onCopy={handleCopy}
            />
          </div>
        </div>
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
