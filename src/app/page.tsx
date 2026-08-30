"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { TerminalHero } from "@/components/home/TerminalHero";
import { HomeStatsBar } from "@/components/home/HomeStatsBar";
import { TrendingGrid } from "@/components/TrendingGrid";
import { CalloutFeed } from "@/components/CalloutFeed";
import { BurnLeaderboard } from "@/components/BurnLeaderboard";
import { QuickSwapCard } from "@/components/home/QuickSwapCard";
import { HomeTrendingMini } from "@/components/home/HomeTrendingMini";
import { AboutSection } from "@/components/AboutSection";
import { BurnModal } from "@/components/BurnModal";
import { LeaderboardItem } from "@/types/token";
import { Coin } from "@/types/coin";
import { Flame, Radio, Trophy, Zap } from "lucide-react";

import { SubmitCalloutModal } from "@/components/modals/SubmitCalloutModal";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";

type MainTab = "callouts" | "trending" | "leaderboard";

export default function OutbidHomePage() {
  const [activeTab, setActiveTab] = useState<MainTab>("callouts");
  const [isSubmitCalloutOpen, setIsSubmitCalloutOpen] = useState(false);
  const { featuredCoin } = useCoinsData();
  const { totalBurned } = useTokenStats();

  // Dynamic Swap target token state (synchronized when clicking ANY token on the left)
  const [selectedSwapToken, setSelectedSwapToken] = useState<{
    mint: string;
    symbol: string;
    name?: string;
    imageUrl?: string;
  }>({
    mint: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
    symbol: "BATON",
    name: "Baton Corporation Ltd",
    imageUrl: "/images/baton-logo.png",
  });

  const [selectedCoinForBurn, setSelectedCoinForBurn] = useState<Coin | null>(null);
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);

  const handleSelectSwapToken = (mint: string, symbol: string, name?: string, imageUrl?: string) => {
    if (!mint) return;
    setSelectedSwapToken({
      mint,
      symbol: symbol.toUpperCase(),
      name: name || symbol,
      imageUrl: imageUrl || (mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump" ? "/images/baton-logo.png" : undefined),
    });
  };

  const handleBoostFromLeaderboard = (item: LeaderboardItem) => {
    setSelectedCoinForBurn({
      id: `leaderboard-${item.ca}`,
      name: item.projectName,
      ticker: item.symbol,
      mintAddress: item.ca,
      imageUrl: item.iconUrl || "/images/baton-logo.png",
      headerUrl: "",
      iconColor: "#f59e0b",
      category: "Ranked",
      marketCap: item.mcap,
      volume24h: item.volume24h,
      change24h: 0,
      sparkline: [],
      totalBurnedBaton: item.totalBatonBurned,
      burnLevel: "gold",
    });
    setIsBurnModalOpen(true);
  };

  const handleOpenOutbid = () => {
    setSelectedCoinForBurn(
      featuredCoin || {
        id: "featured-baton",
        name: "Baton Protocol",
        ticker: "BATON",
        mintAddress: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
        imageUrl: "/images/baton-logo.png",
        headerUrl: "",
        iconColor: "#f59e0b",
        category: "Featured",
        marketCap: 2500000,
        volume24h: 180000,
        change24h: 0,
        sparkline: [],
        totalBurnedBaton: totalBurned || 1500000,
        burnLevel: "diamond",
      }
    );
    setIsBurnModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-[#08090C] text-zinc-800 dark:text-zinc-200 selection:bg-amber-500 selection:text-black font-space">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-5 space-y-5 pb-24 md:pb-8">
        {/* ── Compact Cyberpunk Terminal Hero ─────────────────────────── */}
        <TerminalHero
          onExploreCallouts={() => {
            setActiveTab("callouts");
            const el = document.getElementById("callout-feed-section");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          onPostCallout={() => setIsSubmitCalloutOpen(true)}
          onQuickSwapClick={() => {
            const el = document.getElementById("quick-swap-container");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* ── Main Split View (Left 65% Tabs, Right 35% Sticky Swap) ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Left Column (65% / col-span-8): Terminal Tabs ──────────── */}
          <section id="callout-feed-section" className="lg:col-span-8 space-y-5 scroll-mt-20">
            {/* Terminal Main Tabs Navigation */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-1.5 flex items-center gap-1 font-mono text-xs shadow-md">
              <button
                type="button"
                onClick={() => setActiveTab("callouts")}
                className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-[11px] sm:text-xs ${
                  activeTab === "callouts"
                    ? "bg-amber-500 text-zinc-950 shadow-md font-extrabold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>📢 Live Callouts</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("trending")}
                className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-[11px] sm:text-xs ${
                  activeTab === "trending"
                    ? "bg-amber-500 text-zinc-950 shadow-md font-extrabold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>🔥 Trending</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("leaderboard")}
                className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-[11px] sm:text-xs ${
                  activeTab === "leaderboard"
                    ? "bg-amber-500 text-zinc-950 shadow-md font-extrabold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>🏆 Leaderboard</span>
              </button>
            </div>

            {/* Tab 1: Live Alpha Callouts Feed (Default) */}
            {activeTab === "callouts" && (
              <div className="animate-in fade-in duration-150">
                <CalloutFeed onSelectToken={handleSelectSwapToken} />
              </div>
            )}

            {/* Tab 2: Trending & Bonding Curves */}
            {activeTab === "trending" && (
              <div className="animate-in fade-in duration-150">
                <TrendingGrid onSelectToken={handleSelectSwapToken} />
              </div>
            )}

            {/* Tab 3: Burn-to-Rank Standings */}
            {activeTab === "leaderboard" && (
              <div className="animate-in fade-in duration-150">
                <BurnLeaderboard onBoostToken={handleBoostFromLeaderboard} />
              </div>
            )}
          </section>

          {/* ── Right Column (35% / col-span-4 - Sticky Swap Terminal) ── */}
          <aside id="quick-swap-container" className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
            {/* Quick Swap Card with Live Selected Token Sync */}
            <QuickSwapCard
              targetMint={selectedSwapToken.mint}
              targetSymbol={selectedSwapToken.symbol}
              targetName={selectedSwapToken.name}
              targetIconUrl={selectedSwapToken.imageUrl}
              onTokenChange={(mint, symbol) => handleSelectSwapToken(mint, symbol)}
            />

            {/* Top Trending Alpha Movers Widget */}
            <HomeTrendingMini onSelectSwapToken={handleSelectSwapToken} />
          </aside>
        </div>

        {/* ── Bottom Section: About & How It Works ─────────────────────── */}
        <div className="pt-6 sm:pt-8 border-t border-zinc-200 dark:border-white/10">
          <AboutSection />
        </div>
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Fixed Bottom Navigation Bar (Mobile / Tablet Only) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        targetMint={selectedSwapToken.mint}
        targetSymbol={selectedSwapToken.symbol}
        targetName={selectedSwapToken.name}
        onTokenChange={(mint, symbol) => handleSelectSwapToken(mint, symbol)}
      />

      {/* 5. On-Chain Burn Modal */}
      {isBurnModalOpen && selectedCoinForBurn && (
        <BurnModal
          coin={selectedCoinForBurn}
          isOpen={isBurnModalOpen}
          onClose={() => {
            setIsBurnModalOpen(false);
            setSelectedCoinForBurn(null);
          }}
        />
      )}

      {/* 6. Submit Callout Modal */}
      {isSubmitCalloutOpen && (
        <SubmitCalloutModal
          isOpen={isSubmitCalloutOpen}
          onClose={() => setIsSubmitCalloutOpen(false)}
          onSubmitSuccess={() => {
            setActiveTab("callouts");
            setIsSubmitCalloutOpen(false);
          }}
        />
      )}
    </div>
  );
}
