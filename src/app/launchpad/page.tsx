"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Ticker } from "@/components/Ticker";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturedCard } from "@/components/FeaturedCard";
import { TopHolders } from "@/components/TopHolders";
import { RecentBurns } from "@/components/RecentBurns";
import { CoinGrid } from "@/components/CoinGrid";
import { BurnModal } from "@/components/BurnModal";
import { TierBadge } from "@/components/TierBadge";
import { Coin } from "@/types/coin";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";
import { useRecentBurns } from "@/hooks/useRecentBurns";
import { Trophy, Info, PlusCircle, Zap, Star, ShieldCheck, RefreshCw, ArrowLeft } from "lucide-react";

export default function LaunchpadPage() {
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const { coins, featuredCoin, isLoading: coinsLoading, lastUpdated, refresh } = useCoinsData(15_000);
  const { totalBurned, topHolders, totalHoldersCount, isLoading: statsLoading, refresh: refreshStats } = useTokenStats(15_000);
  const { recentBurns, refresh: refreshBurns, isLoading: burnsLoading } = useRecentBurns(10_000);

  const topLeader = [...coins].sort((a, b) => b.totalBurnedBaton - a.totalBurnedBaton)[0] || {
    ticker: "BATON",
    burnLevel: "diamond",
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* 1. Top Ticker */}
      <Ticker />

      {/* 2. Main Navbar */}
      <Navbar />

      {/* 3. Hero Section */}
      <Hero
        totalBurnedBaton={totalBurned}
        activeCoinsCount={coins.length}
        topCommunityTicker={`$${topLeader.ticker}`}
        topCommunityTier={topLeader.burnLevel.toUpperCase()}
        headerUrl={featuredCoin?.headerUrl}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Navigation Breadcrumb back to Outbid Directory */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:text-orange-500 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Return to Outbid Directory</span>
          </Link>
          <span className="text-xs font-mono text-zinc-500">Mascots &amp; Burn Hub</span>
        </div>

        {/* Featured Card Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-rose-500 dark:text-magenta fill-rose-500/20 dark:fill-magenta/20 animate-pulse" />
              <h2 className="font-archivo text-xl text-zinc-900 dark:text-text tracking-wide">
                Featured Mascot
              </h2>
              <span className="text-[11px] font-mono text-rose-600 dark:text-magenta bg-rose-50 dark:bg-magenta/10 border border-rose-200 dark:border-magenta/20 px-2 py-0.5 rounded uppercase font-bold">
                Hero Spotlight
              </span>
            </div>

            {lastUpdated && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-text-faint">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-up animate-ping" />
                <span>Live · 15s sync ({lastUpdated.toLocaleTimeString()})</span>
                <button
                  onClick={() => {
                    refresh();
                    refreshStats();
                    refreshBurns();
                  }}
                  className="p-1 hover:text-emerald-600 dark:hover:text-acid transition-colors"
                  title="Refresh Live Data"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <FeaturedCard
            name={featuredCoin?.name || "Baton"}
            ticker={`$${featuredCoin?.ticker || "BATON"}`}
            description="The premier community-driven mascot token and deflationary burn engine on Solana."
            mintAddress={featuredCoin?.mintAddress || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump"}
            imageUrl={featuredCoin?.imageUrl}
            marketCap={featuredCoin?.marketCap || 12_435}
            volume24h={featuredCoin?.volume24h || 653}
            change24h={featuredCoin?.change24h || 16.09}
            totalBurnedBaton={totalBurned}
            isLoading={coinsLoading || statsLoading}
            onBurnClick={() =>
              setSelectedCoin(
                featuredCoin || {
                  id: "baton-featured",
                  name: "Baton",
                  ticker: "BATON",
                  mintAddress: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
                  iconColor: "#ff3d7a",
                  marketCap: 12_435,
                  volume24h: 653,
                  change24h: 16.09,
                  sparkline: [10, 12, 11, 14, 13, 16, 18],
                  totalBurnedBaton: totalBurned,
                  burnLevel: "diamond",
                }
              )
            }
          />
        </section>

        {/* Live Top Holders Section */}
        <TopHolders
          holders={topHolders}
          totalHoldersCount={totalHoldersCount}
          isLoading={statsLoading}
          onRefresh={refreshStats}
          lastUpdated={lastUpdated}
        />

        {/* Tier Multipliers Banner */}
        <section className="bg-zinc-900/60 dark:bg-[#111318]/80 backdrop-blur-md border border-zinc-800 dark:border-white/10 rounded-2xl p-6 shadow-xl shadow-black/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-archivo text-lg text-white font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-lime-400" />
                <span>$BATON Burn Tiers &amp; Visibility Multipliers</span>
              </h2>
              <p className="text-sm text-zinc-400 font-space">
                Every $BATON burned directly upgrades your token&apos;s directory ranking and community trust score.
              </p>
            </div>
            <span className="bg-lime-400/10 text-lime-400 border border-lime-400/20 font-semibold px-3 py-1 rounded-full text-xs font-mono uppercase w-max select-none">
              Automatic Tier Progression
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 font-mono">
            <div className="bg-zinc-950/60 border border-amber-700/40 rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-500">Bronze Tier</span>
                <span className="text-[11px] text-zinc-400">10K $BATON</span>
              </div>
              <div className="text-zinc-400 text-xs mt-1 font-space">1.5x Directory Multiplier</div>
            </div>

            <div className="bg-zinc-950/60 border border-slate-500/40 rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Silver Tier</span>
                <span className="text-[11px] text-zinc-400">50K $BATON</span>
              </div>
              <div className="text-zinc-400 text-xs mt-1 font-space">3x Visibility Boost</div>
            </div>

            <div className="bg-zinc-950/60 border border-yellow-500/40 rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] shadow-[0_0_15px_rgba(234,179,8,0.08)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-400">Gold Tier</span>
                <span className="text-[11px] text-zinc-400">250K $BATON</span>
              </div>
              <div className="text-zinc-400 text-xs mt-1 font-space">6x Priority Placement</div>
            </div>

            <div className="bg-zinc-950/60 border border-cyan-400/50 rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">Diamond Tier</span>
                <span className="text-[11px] text-zinc-400">1M+ $BATON</span>
              </div>
              <div className="text-zinc-400 text-xs mt-1 font-space">10x Hero Spotlight &amp; Glow</div>
            </div>
          </div>
        </section>

        {/* Directory Showcase with CoinGrid */}
        <CoinGrid
          coins={coins}
          isLoading={coinsLoading}
          onBurnClick={(c) => setSelectedCoin(c)}
        />

        {/* Live Recent Burns Table */}
        <RecentBurns
          burns={recentBurns}
          isLoading={burnsLoading}
          onRefresh={refreshBurns}
        />

        {/* Leaderboard Preview */}
        <section id="leaderboard" className="rounded-3xl border border-zinc-200/80 dark:border-line bg-white/85 dark:bg-bg-card p-6 sm:p-8 space-y-4 shadow-xl shadow-zinc-200/30 dark:shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-500 dark:text-[#ffd700]" />
              <h2 className="font-archivo text-xl text-zinc-900 dark:text-text">Top Burn Leaderboard</h2>
            </div>
            <Link href="/leaderboard" className="text-xs font-mono text-emerald-600 dark:text-acid font-bold hover:underline">
              View Full Rankings →
            </Link>
          </div>

          <div className="divide-y divide-zinc-200/60 dark:divide-line font-mono text-xs">
            {[...coins]
              .sort((a, b) => b.totalBurnedBaton - a.totalBurnedBaton)
              .slice(0, 4)
              .map((coin, index) => (
                <div
                  key={coin.id}
                  className="py-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-bg-raised/40 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black text-emerald-600 dark:text-acid">#{index + 1}</span>
                    <span className="font-bold text-zinc-900 dark:text-text">${coin.ticker}</span>
                    <span className="text-zinc-500 dark:text-text-dim hidden sm:inline">{coin.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <TierBadge level={coin.burnLevel} />
                    <span className="text-emerald-600 dark:text-acid font-black font-mono-num">
                      {coin.totalBurnedBaton.toLocaleString()} $BATON
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Add Coin / About Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section id="add-coin" className="p-6 rounded-2xl border border-zinc-200/80 dark:border-line bg-white/85 dark:bg-bg-raised shadow-md shadow-zinc-200/30 dark:shadow-none space-y-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600 dark:text-acid" />
              <h3 className="font-archivo text-lg text-zinc-900 dark:text-text">List Coin &amp; Climb Ranks</h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-text-dim font-space leading-relaxed">
              List your Solana pump.fun mascot memecoin on the official directory, burn $BATON with your community, and secure a spot in the Diamond League spotlight.
            </p>
            <Link
              href="/submit"
              className="inline-block px-4 py-2 bg-zinc-900 dark:bg-acid text-white dark:text-bg font-mono text-xs font-bold rounded-lg hover:bg-emerald-600 dark:hover:bg-acid-dim transition-all shadow-sm"
            >
              Submit Mascot Coin 🚀
            </Link>
          </section>

          <section id="about" className="p-6 rounded-2xl border border-zinc-200/80 dark:border-line bg-white/85 dark:bg-bg-raised shadow-md shadow-zinc-200/30 dark:shadow-none space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-rose-500 dark:text-magenta" />
              <h3 className="font-archivo text-lg text-zinc-900 dark:text-text">$BATON Burn Mechanism</h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-text-dim font-space leading-relaxed">
              Every $BATON burned is permanently removed from circulation on the Solana blockchain with cryptographic on-chain memos.
            </p>
          </section>
        </div>

        {/* Burn Modal */}
        <BurnModal
          coin={selectedCoin}
          isOpen={!!selectedCoin}
          onClose={() => setSelectedCoin(null)}
          onSuccess={() => {
            refresh();
            refreshStats();
            refreshBurns();
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-line bg-white dark:bg-bg-raised py-8 mt-16 text-xs text-zinc-500 dark:text-text-faint font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-acid" />
            <span>$BATON Launchpad • Solana Community Ecosystem</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-600 dark:text-text-dim">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              Outbid Directory
            </Link>
            <span>•</span>
            <Link href="/leaderboard" className="hover:text-emerald-600 transition-colors">
              Leaderboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
