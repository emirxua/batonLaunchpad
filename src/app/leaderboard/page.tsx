"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BurnLeaderboard } from "@/components/BurnLeaderboard";
import { RecentBurns } from "@/components/RecentBurns";
import { useRecentBurns } from "@/hooks/useRecentBurns";
import { BurnModal } from "@/components/BurnModal";
import { BoostAnyTokenModal } from "@/components/modals/BoostAnyTokenModal";
import { LeaderboardItem } from "@/types/token";
import { Coin } from "@/types/coin";
import { Trophy, Flame, Zap, ShieldCheck, Info, ExternalLink } from "lucide-react";

export default function LeaderboardPage() {
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);
  const [isBoostAnyModalOpen, setIsBoostAnyModalOpen] = useState(false);
  const { recentBurns, isLoading: isLoadingBurns, refresh: refreshBurns } = useRecentBurns();

  const handleBoostToken = (item: LeaderboardItem) => {
    setSelectedCoin({
      id: `leaderboard-${item.ca}`,
      name: item.projectName,
      ticker: item.symbol,
      mintAddress: item.ca,
      imageUrl: item.iconUrl,
      iconColor: "#f59e0b",
      marketCap: item.mcap,
      volume24h: item.volume24h,
      change24h: 0,
      sparkline: [],
      totalBurnedBaton: item.totalBatonBurned,
      burnLevel: "gold",
    });
    setIsBurnModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#08090C] text-zinc-800 dark:text-zinc-200 selection:bg-amber-500 selection:text-black font-space">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Compact Sleek Top Hero ────────────────────────────────────── */}
        <section className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-[#0d0e12] to-zinc-950 p-4 sm:p-5 lg:p-6 overflow-hidden shadow-xl font-mono">
          <div
            className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>BURN-TO-RANK LEADERBOARD</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                SOLANA <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">BURN STANDINGS</span>
              </h1>
              <p className="text-xs text-zinc-400 max-w-lg">
                Top Solana projects ranked strictly by total verified <span className="text-amber-400 font-bold">$BATON</span> burned on-chain to the dead incinerator.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsBoostAnyModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer uppercase tracking-wider"
              >
                <Flame className="w-4 h-4 fill-current text-zinc-950" />
                <span>🔥 Boost Any Token</span>
              </button>

              <a
                href="https://solscan.io/token/2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump#txs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <span>Solscan Log</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </a>

              <div className="px-3 py-2 rounded-xl bg-zinc-900/90 border border-white/10 text-center shadow-md">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">VERIFICATION</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% On-Chain
                </span>
              </div>

              <div className="px-3 py-2 rounded-xl bg-zinc-900/90 border border-white/10 text-center shadow-md">
                <span className="text-[9px] text-zinc-500 uppercase font-bold block">DEAD WALLET</span>
                <span className="text-xs font-mono font-bold text-amber-400">1111..1111</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Static Burn Leaderboard Component ─────────────────────────── */}
        <BurnLeaderboard onBoostToken={handleBoostToken} />

        {/* ── Live Verified On-Chain Burns Feed ─────────────────────────── */}
        <RecentBurns burns={recentBurns} isLoading={isLoadingBurns} onRefresh={refreshBurns} />

        {/* ── About & Mechanics Section ──────────────────────────────────── */}
        <section className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 p-6 sm:p-8 space-y-6 font-mono shadow-xl">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-white/5 pb-4">
            <Info className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
              About Outbid &amp; Burn Mechanics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
                1
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Deflationary On-Chain Burn
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When you boost a project, 100% of the $BATON is sent directly to the Solana Incinerator / Dead Address (<code>1111111111111111111111111111111111111111</code>), permanently reducing total supply.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center">
                2
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Burn-to-Rank Algorithm
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                The leaderboard rank is determined strictly by verified on-chain burns. The project with the highest burn volume holds the #1 King of the Hill spotlight position.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center">
                3
              </div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Verifiable Transparency
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Every burn generates a verifiable cryptographic transaction signature on the Solana blockchain that can be viewed and verified instantly on Solscan.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. On-Chain Burn Modal */}
      {isBurnModalOpen && selectedCoin && (
        <BurnModal
          coin={selectedCoin}
          isOpen={isBurnModalOpen}
          onClose={() => {
            setIsBurnModalOpen(false);
            setSelectedCoin(null);
          }}
        />
      )}

      {/* 5. Boost Any Token Modal */}
      <BoostAnyTokenModal
        isOpen={isBoostAnyModalOpen}
        onClose={() => setIsBoostAnyModalOpen(false)}
      />
    </div>
  );
}
