"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Ticker } from "@/components/Ticker";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturedCard } from "@/components/FeaturedCard";
import { TopHolders } from "@/components/TopHolders";
import { CoinGrid } from "@/components/CoinGrid";
import { BurnModal } from "@/components/BurnModal";
import { TierBadge } from "@/components/TierBadge";
import { Coin } from "@/types/coin";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserBatonBalance } from "@/hooks/useUserBatonBalance";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";
import { Flame, Sparkles, Filter, ShieldCheck, ArrowRight, Layers, Trophy, Info, PlusCircle, Zap, Star, Wallet, CheckCircle2, RefreshCw } from "lucide-react";

export default function HomePage() {
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const { publicKey, connected } = useWallet();
  const { solBalance, batonBalance, isLoading: balanceLoading } = useUserBatonBalance();
  const { coins, featuredCoin, isLoading: coinsLoading, lastUpdated, refresh } = useCoinsData(15_000);
  const { totalBurned, topHolders, totalHoldersCount, isLoading: statsLoading, refresh: refreshStats } = useTokenStats(15_000);

  // Top burn leader for Hero display
  const topLeader = [...coins].sort((a, b) => b.totalBurnedBaton - a.totalBurnedBaton)[0] || {
    ticker: "BATON",
    burnLevel: "diamond",
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* 1. Top Acid Ticker */}
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
        {/* Featured Card Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-magenta fill-magenta/20 animate-pulse" />
              <h2 className="font-archivo text-xl text-text tracking-wide">
                Featured Mascot
              </h2>
              <span className="text-[11px] font-mono text-magenta bg-magenta/10 border border-magenta/20 px-2 py-0.5 rounded uppercase font-bold">
                Hero Spotlight
              </span>
            </div>

            {lastUpdated && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-text-faint">
                <span className="w-1.5 h-1.5 rounded-full bg-up animate-ping" />
                <span>Live · 15s sync ({lastUpdated.toLocaleTimeString()})</span>
                <button
                  onClick={() => {
                    refresh();
                    refreshStats();
                  }}
                  className="p-1 hover:text-acid transition-colors"
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
        <section className="p-6 rounded-2xl border border-line bg-bg-raised/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-archivo text-lg text-text flex items-center gap-2">
                <Zap className="w-4 h-4 text-acid" />
                <span>$BATON Burn Tiers &amp; Visibility Multipliers</span>
              </h2>
              <p className="text-xs text-text-dim font-space">
                Every $BATON burned directly upgrades your token&apos;s directory ranking and community trust score.
              </p>
            </div>
            <span className="text-[11px] font-mono text-acid bg-acid/10 border border-acid/20 px-2.5 py-1 rounded-full uppercase font-bold w-max">
              Automatic Tier Progression
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-[#cd7f32]/40 bg-[#cd7f32]/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#e6a86c]">Bronze Tier</span>
                <span className="text-[10px] font-mono text-text-dim">10K $BATON</span>
              </div>
              <div className="text-xs text-text-dim mt-1.5 font-space">1.5x Directory Multiplier</div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#c0c0c0]/40 bg-[#c0c0c0]/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#f0f0f0]">Silver Tier</span>
                <span className="text-[10px] font-mono text-text-dim">50K $BATON</span>
              </div>
              <div className="text-xs text-text-dim mt-1.5 font-space">3x Visibility Boost</div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#ffd700]/40 bg-[#ffd700]/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#ffe033]">Gold Tier</span>
                <span className="text-[10px] font-mono text-text-dim">250K $BATON</span>
              </div>
              <div className="text-xs text-text-dim mt-1.5 font-space">6x Priority Placement</div>
            </div>

            <div className="p-3.5 rounded-xl border border-[#70d6ff]/40 bg-[#70d6ff]/5 shadow-[0_0_20px_rgba(112,214,255,0.12)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#a5e5ff]">Diamond Tier</span>
                <span className="text-[10px] font-mono text-text-dim">1M+ $BATON</span>
              </div>
              <div className="text-xs text-text-dim mt-1.5 font-space">10x Hero Spotlight &amp; Glow</div>
            </div>
          </div>
        </section>

        {/* Directory Showcase with CoinGrid */}
        <CoinGrid
          coins={coins}
          isLoading={coinsLoading}
          onBurnClick={(c) => setSelectedCoin(c)}
        />

        {/* Leaderboard Section */}
        <section id="leaderboard" className="rounded-2xl border border-line bg-bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-[#ffd700]" />
              <h2 className="font-archivo text-xl text-text">Top Burn Leaderboard</h2>
            </div>
            <Link href="/leaderboard" className="text-xs font-mono text-acid hover:underline">
              View Full Rankings →
            </Link>
          </div>

          <div className="divide-y divide-line font-mono text-xs">
            {[...coins]
              .sort((a, b) => b.totalBurnedBaton - a.totalBurnedBaton)
              .slice(0, 4)
              .map((coin, index) => (
                <div
                  key={coin.id}
                  className="py-3 flex items-center justify-between hover:bg-bg-raised/40 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-acid">#{index + 1}</span>
                    <span className="font-bold text-text">${coin.ticker}</span>
                    <span className="text-text-dim hidden sm:inline">{coin.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <TierBadge level={coin.burnLevel} />
                    <span className="text-acid font-bold">
                      {coin.totalBurnedBaton.toLocaleString()} $BATON
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Add Coin / About Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section id="add-coin" className="p-6 rounded-2xl border border-line bg-bg-raised space-y-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-acid" />
              <h3 className="font-archivo text-lg text-text">List Coin &amp; Climb Ranks</h3>
            </div>
            <p className="text-xs text-text-dim font-space leading-relaxed">
              List your Solana pump.fun mascot memecoin on the official directory, burn $BATON with your community, and secure a spot in the Diamond League spotlight.
            </p>
            <Link
              href="/submit"
              className="inline-block px-4 py-2 bg-acid text-bg font-mono text-xs font-bold rounded-lg hover:bg-acid-dim transition-all"
            >
              Submit Mascot Coin 🚀
            </Link>
          </section>

          <section id="about" className="p-6 rounded-2xl border border-line bg-bg-raised space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-magenta" />
              <h3 className="font-archivo text-lg text-text">$BATON Burn Mechanism</h3>
            </div>
            <p className="text-xs text-text-dim font-space leading-relaxed">
              Every $BATON burned is permanently removed from circulation on the Solana blockchain with cryptographic on-chain memos. Higher burn levels give projects extended reach across decentralized investors.
            </p>
          </section>
        </div>

        {/* SPL Token Burn Modal */}
        <BurnModal
          coin={selectedCoin}
          isOpen={!!selectedCoin}
          onClose={() => setSelectedCoin(null)}
          onSuccess={() => {
            refresh();
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-bg-raised py-8 mt-16 text-xs text-text-faint font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-acid" />
            <span>$BATON Launchpad • Solana pump.fun Community Ecosystem</span>
          </div>
          <div className="flex items-center gap-4 text-text-dim">
            <a
              href="https://x.com/buybaton"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-acid transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@buybaton</span>
            </a>
            <span>•</span>
            <a
              href="https://pump.fun/coin/2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-magenta transition-colors"
            >
              pump.fun
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
