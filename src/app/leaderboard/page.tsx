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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Main Burn Leaderboard Component (Includes Standings Banner & Recent Burns) ── */}
        <BurnLeaderboard onBoostToken={handleBoostToken} />

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
