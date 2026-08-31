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
        {/* ── Sleek Modern Top Hero with Platform Rule Notice ────────────── */}
        <section className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-[#0d0e12] to-zinc-950 p-5 sm:p-6 overflow-hidden shadow-2xl font-mono select-none">
          <div
            className="pointer-events-none absolute -top-12 -right-12 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>BURN-TO-RANK ENGINE</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  SOLANA <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">BURN STANDINGS</span>
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
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
                  <span>Solscan Proofs</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
              </div>
            </div>

            {/* Official Rule Callout Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-zinc-300">
                <span className="text-amber-400 font-extrabold uppercase mr-1">
                  Verified Burn-to-Rank Rule:
                </span>
                Burning <strong className="text-white">$BATON</strong> directly elevates your coin or project ranking on the global leaderboard.
                <span className="text-amber-300 font-bold block sm:inline sm:ml-1">
                  ⚠️ Note: Only burns executed directly through the Outbid platform are cryptographically verified and counted towards the official standings.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Static Burn Leaderboard Component ─────────────────────────── */}
        <BurnLeaderboard onBoostToken={handleBoostToken} />

        {/* ── Live Verified On-Chain Burns Feed ─────────────────────────── */}
        <RecentBurns burns={recentBurns} isLoading={isLoadingBurns} onRefresh={refreshBurns} />

        {/* ── Sleek Minimal Burn Mechanics Overview ─────────────────────── */}
        <section className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-950/60 font-mono text-xs select-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/5 space-y-1.5 hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase">
                  Deflationary Burn
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                100% of boosted $BATON is sent directly to the Solana Incinerator (<code>1111..1111</code>), permanently reducing the circulating supply.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/5 space-y-1.5 hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase">
                  Burn-to-Rank
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Rankings update in real time based on verified on-chain burns. The project with the highest burn volume holds the #1 crown.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-white/5 space-y-1.5 hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                  3
                </span>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase">
                  On-Chain Verified
                </h3>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Every burn generates a verifiable cryptographic transaction signature on Solana, viewable instantly with Solscan proof links.
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
