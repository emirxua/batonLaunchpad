"use client";

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LeaderboardItem } from "@/types/token";
import { Coin } from "@/types/coin";

const TerminalHero = dynamic(
  () => import("@/components/home/TerminalHero").then((mod) => mod.TerminalHero),
  { ssr: false }
);
const CalloutFeed = dynamic(
  () => import("@/components/CalloutFeed").then((mod) => mod.CalloutFeed),
  { ssr: false }
);
const TrendingGrid = dynamic(
  () => import("@/components/TrendingGrid").then((mod) => mod.TrendingGrid),
  { ssr: false }
);
const BurnLeaderboard = dynamic(
  () => import("@/components/BurnLeaderboard").then((mod) => mod.BurnLeaderboard),
  { ssr: false }
);
const JupiterSwapModal = dynamic(
  () => import("@/components/modals/JupiterSwapModal").then((mod) => mod.JupiterSwapModal),
  { ssr: false }
);
const BurnModal = dynamic(
  () => import("@/components/BurnModal").then((mod) => mod.BurnModal),
  { ssr: false }
);
const MobileBottomNav = dynamic(
  () => import("@/components/layout/MobileBottomNav").then((mod) => mod.MobileBottomNav),
  { ssr: false }
);
import Link from "next/link";
import { Flame, Radio, Trophy, Zap, Terminal, ArrowUpRight } from "lucide-react";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";

type MainTab = "callouts" | "trending" | "leaderboard";

export default function OutbidHomePage() {
  const [activeTab, setActiveTab] = useState<MainTab>("callouts");
  const { featuredCoin } = useCoinsData();
  const { totalBurned } = useTokenStats();

  // Listen for navigation events (e.g. clicking logo switches to Callouts Feed instantly)
  React.useEffect(() => {
    const handleSetTab = (e: any) => {
      if (e?.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener("outbid:set-tab", handleSetTab);
    return () => window.removeEventListener("outbid:set-tab", handleSetTab);
  }, []);

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

  const handleSelectSwapToken = useCallback((mint: string, symbol: string, name?: string, imageUrl?: string) => {
    if (!mint) return;
    setSelectedSwapToken({
      mint,
      symbol: symbol.toUpperCase(),
      name: name || symbol,
      imageUrl: imageUrl || (mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump" ? "/images/baton-logo.png" : undefined),
    });
    setIsJupiterSwapModalOpen(true);
  }, []);

  const handleBoostFromLeaderboard = useCallback((item: LeaderboardItem) => {
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
  }, []);

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

  const [isJupiterSwapModalOpen, setIsJupiterSwapModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14] text-zinc-900 dark:text-zinc-200 selection:bg-amber-500 selection:text-black font-space">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-5 space-y-5 pb-36 md:pb-12">
        {/* ── Compact Cyberpunk Terminal Hero ─────────────────────────── */}
        <TerminalHero
          onExploreCallouts={() => {
            setActiveTab("callouts");
          }}
          onQuickSwapClick={() => setIsJupiterSwapModalOpen(true)}
        />

        {/* ── Main Full-Width Terminal View (Callout-First Focus) ───── */}
        <div className="w-full space-y-4">
          {/* Terminal Main Tabs Navigation */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-1.5 flex items-center gap-1.5 font-mono text-xs shadow-md">
            <button
              type="button"
              onClick={() => setActiveTab("callouts")}
              className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer text-xs ${
                activeTab === "callouts"
                  ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
              }`}
            >
              <Radio className="w-3.5 h-3.5 shrink-0" />
              <span>Callouts Feed</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("trending")}
              className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer text-xs ${
                activeTab === "trending"
                  ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Trending</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("leaderboard")}
              className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer text-xs ${
                activeTab === "leaderboard"
                  ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current text-orange-500 shrink-0" />
              <span>Burn-to-Rank</span>
            </button>
          </div>

          {/* Tab 1: Live Alpha Callouts Feed (Default & Primary Focus) */}
          <div className={activeTab === "callouts" ? "block" : "hidden"}>
            <CalloutFeed onSelectToken={handleSelectSwapToken} />
          </div>

          {/* Tab 2: Trending & Bonding Curves */}
          <div className={activeTab === "trending" ? "block" : "hidden"}>
            <TrendingGrid onSelectToken={handleSelectSwapToken} />
          </div>

          {/* Tab 3: Burn-to-Rank Standings */}
          <div className={activeTab === "leaderboard" ? "block" : "hidden"}>
            <BurnLeaderboard onBoostToken={handleBoostFromLeaderboard} />
          </div>
        </div>

        {/* ── Callout / Community Quick Strip (Ultra-Minimal) ─────────── */}
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
        targetIconUrl={selectedSwapToken.imageUrl}
        onOpenSwapModal={() => setIsJupiterSwapModalOpen(true)}
        onOpenBurnModal={() => {
          setSelectedCoinForBurn({
            coinId: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
            name: "$BATON",
            ticker: "BATON",
            symbol: "BATON",
            image_uri: "/images/baton-logo.png",
            mint: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
          } as any);
          setIsBurnModalOpen(true);
        }}
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

      {/* 6. Quick Terminal Jupiter Swap Modal */}
      {isJupiterSwapModalOpen && (
        <JupiterSwapModal
          isOpen={isJupiterSwapModalOpen}
          onClose={() => setIsJupiterSwapModalOpen(false)}
          targetMint={selectedSwapToken.mint}
          targetSymbol={selectedSwapToken.symbol}
          targetName={selectedSwapToken.name}
          targetIconUrl={selectedSwapToken.imageUrl}
        />
      )}
    </div>
  );
}
