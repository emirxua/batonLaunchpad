"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Ticker } from "@/components/Ticker";
import { LiveCallouts } from "@/components/callouts/LiveCallouts";
import { TrackedLeaderboard } from "@/components/callouts/TrackedLeaderboard";
import { BurnModal } from "@/components/BurnModal";
import { CalloutsApiResponse } from "@/lib/types/callouts";
import { Coin } from "@/types/coin";
import confetti from "canvas-confetti";

const fetcher = (url: string): Promise<CalloutsApiResponse> =>
  fetch(url).then((r) => r.json());

function CalloutsPageContent() {
  const searchParams = useSearchParams();
  const initialCaller = searchParams?.get("caller") ?? null;

  const [selectedCaller, setSelectedCaller] = useState<string | null>(initialCaller);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Sync state when URL query parameter changes
  useEffect(() => {
    const callerParam = searchParams?.get("caller");
    if (callerParam !== selectedCaller) {
      setSelectedCaller(callerParam || null);
    }
  }, [searchParams]);

  // Update caller filter and URL cleanly
  const handleSelectCaller = useCallback((caller: string | null) => {
    setSelectedCaller(caller);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (caller) {
        url.searchParams.set("caller", caller);
      } else {
        url.searchParams.delete("caller");
      }
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Single SWR subscription — 60s auto refresh, shared between feed and leaderboard
  const { data, isLoading, isValidating, mutate } = useSWR<CalloutsApiResponse>(
    "/api/callouts",
    fetcher,
    {
      refreshInterval: 60_000,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 2,
      errorRetryInterval: 10_000,
      keepPreviousData: true,
    }
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleBoostCoin = (target: { mint: string; name?: string; symbol?: string; logo?: string } | string) => {
    const mint = typeof target === "string" ? target : target.mint;
    const name = typeof target === "object" && target.name ? target.name : mint.slice(0, 8);
    const symbol = typeof target === "object" && target.symbol ? target.symbol : "?";
    const logo = typeof target === "object" ? target.logo : undefined;

    setSelectedCoin({
      id: `callout-${mint}`,
      name: name,
      ticker: symbol,
      mintAddress: mint,
      imageUrl: logo,
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
          {/* Left: callout card stream with caller filtering */}
          <LiveCallouts
            data={data}
            isLoading={isLoading}
            isValidating={isValidating}
            mutate={mutate}
            copied={copied}
            onCopy={handleCopy}
            onBoostCoin={handleBoostCoin}
            selectedCaller={selectedCaller}
            onSelectCaller={handleSelectCaller}
          />

          {/* Right: watchlist leaderboard (sticky) */}
          <div className="lg:sticky lg:top-[88px]">
            <TrackedLeaderboard
              data={data}
              isLoading={isLoading}
              copied={copied}
              onCopy={handleCopy}
              selectedCaller={selectedCaller}
              onSelectCaller={handleSelectCaller}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

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

export default function CalloutsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <CalloutsPageContent />
    </Suspense>
  );
}
