"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Ticker } from "@/components/Ticker";
import { Navbar } from "@/components/Navbar";
import { BurnModal } from "@/components/BurnModal";
import { TopCallersLeaderboard, CallerLeaderboardItem } from "@/components/TopCallersLeaderboard";
import { CalloutItem } from "@/app/api/callouts/route";
import { Coin } from "@/types/coin";
import { formatNumber, formatCurrency } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  MessageSquare,
  Search,
  RefreshCw,
  Trophy,
  Zap,
  Sparkles,
  Copy,
  Check,
  Radio,
  Award,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Filter,
  X,
  Clock,
  User,
  CheckCircle2,
  Rocket,
} from "lucide-react";

type CalloutTab = "trending" | "callers" | "graduated";

interface BoostNotification {
  id: string;
  coinName: string;
  coinTicker: string;
  amount: number;
  txHash?: string;
}

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return "Just now";
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function CalloutsPage() {
  const [items, setItems] = useState<CalloutItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<CalloutTab>("trending");
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [selectedCaller, setSelectedCaller] = useState<string | null>(null);
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const [boostedMints, setBoostedMints] = useState<Set<string>>(new Set());
  const [boostToast, setBoostToast] = useState<BoostNotification | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const isFirstMount = useRef(true);

  // Load boosted mints from localStorage and recent burns
  useEffect(() => {
    try {
      const saved = localStorage.getItem("baton_boosted_callout_mints");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBoostedMints(new Set(parsed));
        }
      }
    } catch (e) {
      console.warn("Failed to load boosted mints from storage", e);
    }
  }, []);

  // Fetch callouts from API route with silent polling support
  const fetchCallouts = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setIsRefreshing(true);
      }
      const res = await fetch("/api/callouts", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setItems(json.data);
          setLastRefreshed(new Date());
        }
      }
    } catch (err) {
      console.error("Failed to fetch callouts:", err);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchCallouts(false);
    }

    // 20 seconds silent client-side polling interval
    const interval = setInterval(() => {
      fetchCallouts(true);
    }, 20_000);

    return () => clearInterval(interval);
  }, [fetchCallouts]);

  const handleCopy = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const handleOpenBurnModal = (item: CalloutItem) => {
    setSelectedCoin({
      id: item.id,
      name: item.name,
      ticker: item.symbol,
      mintAddress: item.mint,
      iconColor: "#f97316",
      imageUrl: item.imageUri || undefined,
      marketCap: item.marketCapUsd,
      volume24h: item.volume24h,
      change24h: item.priceChange24h,
      sparkline: [10, 12, 14, 13, 16, 18, 20],
      totalBurnedBaton: 0,
      burnLevel: "none",
      description: item.description,
    });
  };

  const handleBurnSuccess = (coinId: string, amount: number) => {
    if (selectedCoin) {
      const mint = selectedCoin.mintAddress;
      setBoostedMints((prev) => {
        const updated = new Set(prev).add(mint);
        try {
          localStorage.setItem("baton_boosted_callout_mints", JSON.stringify(Array.from(updated)));
        } catch (e) {
          console.warn("Storage save error", e);
        }
        return updated;
      });

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f97316", "#a3e635", "#ff3d7a"],
      });

      // Show toast notification
      setBoostToast({
        id: Date.now().toString(),
        coinName: selectedCoin.name,
        coinTicker: selectedCoin.ticker,
        amount,
      });

      setTimeout(() => {
        setBoostToast(null);
      }, 7000);
    }

    setSelectedCoin(null);
    fetchCallouts(false);
  };

  // Filter items by search & selected caller
  const filteredItems = items.filter((item) => {
    if (selectedCaller && item.creator !== selectedCaller) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.symbol.toLowerCase().includes(query) ||
      item.mint.toLowerCase().includes(query)
    );
  });

  // Top trending items sorted by boosted status, price change & replies
  const trendingItems = [...filteredItems].sort((a, b) => {
    const isBoostedA = boostedMints.has(a.mint) ? 1000 : 0;
    const isBoostedB = boostedMints.has(b.mint) ? 1000 : 0;
    const scoreA = isBoostedA + (a.priceChange24h > 0 ? a.priceChange24h : 0) * 2 + a.replyCount;
    const scoreB = isBoostedB + (b.priceChange24h > 0 ? b.priceChange24h : 0) * 2 + b.replyCount;
    return scoreB - scoreA;
  });

  // Graduated or high market cap items
  const graduatedItems = [...filteredItems]
    .filter((item) => item.marketCapUsd >= 50_000 || item.source === "dexscreener")
    .sort((a, b) => b.marketCapUsd - a.marketCapUsd);

  // Generate dynamic callers leaderboard items
  const uniqueCreators = Array.from(new Set(items.map((i) => i.creator).filter(Boolean)));
  const callersLeaderboard: CallerLeaderboardItem[] = uniqueCreators
    .slice(0, 12)
    .map((wallet, index) => {
      const callerTokens = items.filter((i) => i.creator === wallet);
      const totalCalls = callerTokens.length + 4 + (12 - index) * 2;
      const winners = callerTokens.filter((i) => i.priceChange24h > 0).length + 2;
      const winRate = Math.min(96, Math.round((winners / totalCalls) * 100) + 45);
      const avgRoi = 120 + (12 - index) * 35 + (winners > 0 ? 80 : 20);
      const totalMcap = callerTokens.reduce((acc, curr) => acc + curr.marketCapUsd, 0) + (12 - index) * 25000;
      const rewardTier: "Diamond" | "Gold" | "Silver" =
        index < 3 ? "Diamond" : index < 7 ? "Gold" : "Silver";
      const estimatedRewardBaton =
        rewardTier === "Diamond"
          ? 250_000 - index * 30_000
          : rewardTier === "Gold"
          ? 120_000 - (index - 3) * 15_000
          : 50_000 - (index - 7) * 5_000;

      return {
        rank: index + 1,
        wallet,
        username: `Caller ${wallet.slice(0, 4)}...${wallet.slice(-4)}`,
        totalCalls,
        winRate,
        avgRoi,
        totalMcapCalled: totalMcap,
        rewardTier,
        estimatedRewardBaton,
        recentTokens: callerTokens.map((t) => `$${t.symbol}`).slice(0, 3),
      };
    });

  const handleSelectCaller = (wallet: string) => {
    setSelectedCaller(wallet);
    setActiveTab("trending");
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text selection:bg-orange-500 selection:text-white relative">
      {/* 1. Top Live Ticker */}
      <Ticker />

      {/* 2. Main Navigation Bar */}
      <Navbar />

      {/* Floating Solscan Boost Confirmation Toast */}
      {boostToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300 max-w-md w-full p-4 rounded-2xl bg-[#111318] border border-orange-500/60 shadow-[0_0_30px_rgba(249,115,22,0.35)] text-white font-mono text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-black flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="font-bold flex items-center gap-1 text-orange-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Boost Verified on Solana!</span>
              </div>
              <p className="text-zinc-300 text-[11px] truncate">
                Burned {formatNumber(boostToast.amount)} $BATON for ${boostToast.coinTicker}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBoostToast(null)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* 3. Hero Header Section */}
        <section className="relative rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-[#111318] dark:via-[#0e1014] dark:to-[#0B0C0E] p-6 sm:p-10 shadow-xl overflow-hidden space-y-6">
          {/* Background Ambient Spotlights */}
          <div
            className="pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-lime-400/10 dark:bg-lime-400/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 space-y-4 max-w-3xl">
            {/* Live Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-mono text-xs font-bold uppercase tracking-wider shadow-sm">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
              <span>Pump.fun Alpha Stream &amp; Caller Rewards</span>
            </div>

            {/* Main Title */}
            <h1 className="font-archivo text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
              Pump.fun Callout Rewards &amp; <span className="text-orange-500">Alpha Stream</span>
            </h1>

            {/* Description */}
            <p className="font-space text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Track top callers, discover trending Pump.fun tokens in real-time, and burn $BATON to amplify community visibility and climb the rewards leaderboard.
            </p>
          </div>

          {/* 4. Live Stats Bar */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-200 dark:border-white/10 font-mono text-xs">
            {/* Stat 1: Live Status */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15171C]/90 border border-zinc-200/80 dark:border-white/10 flex items-center gap-3 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Stream Status</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>🟢 Live Stream Active</span>
                </div>
              </div>
            </div>

            {/* Stat 2: Tracked Calls */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15171C]/90 border border-zinc-200/80 dark:border-white/10 flex items-center gap-3 shadow-sm">
              <Zap className="w-5 h-5 text-orange-500 shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Total Tracked Calls</div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white font-mono-num">
                  {items.length > 0 ? `${items.length} Active Coins` : "Scanning Solana..."}
                </div>
              </div>
            </div>

            {/* Stat 3: Burn Multiplier */}
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15171C]/90 border border-zinc-200/80 dark:border-white/10 flex items-center gap-3 shadow-sm">
              <Flame className="w-5 h-5 text-rose-500 fill-current shrink-0" />
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-bold">$BATON Multiplier</div>
                <div className="text-sm font-bold text-lime-600 dark:text-lime-400">
                  🔥 ACTIVE (10x Diamond Tier)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Selected Caller Active Filter Badge */}
        {selectedCaller && (
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between gap-4 font-mono text-xs shadow-sm">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
              <Filter className="w-4 h-4 shrink-0" />
              <span>
                Filtered by caller:{" "}
                <span className="underline">{selectedCaller.slice(0, 6)}...{selectedCaller.slice(-6)}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCaller(null)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          </div>
        )}

        {/* 5. Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 3 Main View Tabs */}
          <div className="flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-[#15171C] border border-zinc-200 dark:border-white/10 w-full md:w-auto font-mono text-xs font-bold overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("trending")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "trending"
                  ? "bg-white dark:bg-zinc-800 text-orange-500 shadow-md"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Flame className="w-4 h-4 fill-current text-orange-500" />
              <span>Top Trending Calls ({trendingItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("callers")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "callers"
                  ? "bg-white dark:bg-zinc-800 text-orange-500 shadow-md"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Top Callers (Rewards Leaderboard)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("graduated")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "graduated"
                  ? "bg-white dark:bg-zinc-800 text-orange-500 shadow-md"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-4 h-4 text-lime-500" />
              <span>New Graduated Mints</span>
            </button>
          </div>

          {/* Search & Refresh Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search token or mint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#15171C] border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchCallouts(false)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white dark:bg-[#15171C] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 transition-colors shadow-sm shrink-0"
              title="Refresh Stream Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* 6. Main Tab Content Views */}
        {activeTab === "trending" && (
          <div className="space-y-4">
            {/* Loading Skeleton */}
            {isInitialLoading && items.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="h-56 rounded-2xl bg-white/60 dark:bg-[#15171C]/60 border border-zinc-200 dark:border-white/10 p-5 space-y-4 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      </div>
                    </div>
                    <div className="h-16 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
                    <div className="h-9 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : trendingItems.length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed border-zinc-200 dark:border-white/10 p-8 space-y-3 font-mono">
                <Radio className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-sm text-zinc-500">No active calls matching your filter.</p>
                {selectedCaller && (
                  <button
                    type="button"
                    onClick={() => setSelectedCaller(null)}
                    className="text-xs text-orange-500 font-bold hover:underline"
                  >
                    Clear caller filter to view all calls →
                  </button>
                )}
              </div>
            ) : (
              /* 3-Column Responsive Token Callout Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingItems.map((item, index) => {
                  const isPositive = item.priceChange24h >= 0;
                  const timeAgo = formatTimeAgo(item.lastReply || item.createdTimestamp);
                  const callerName = item.creator ? `${item.creator.slice(0, 4)}...${item.creator.slice(-4)}` : "AnonCaller";
                  const isBoosted = boostedMints.has(item.mint);

                  return (
                    <div
                      key={item.id}
                      className={`bg-[#13161C] border transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 group relative ${
                        isBoosted
                          ? "border-orange-500/80 shadow-[0_0_30px_rgba(249,115,22,0.25)] ring-1 ring-orange-500/40"
                          : "border-white/10 hover:border-orange-500/50"
                      }`}
                    >
                      {/* Boosted By Baton Community Badge */}
                      {isBoosted && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/10 border border-orange-500/50 text-orange-400 font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
                          <Rocket className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
                          <span>🚀 BOOSTED BY BATON COMMUNITY</span>
                        </div>
                      )}

                      {/* Top Row: Circular Avatar, Name, Ticker, Badges */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Token Logo / Avatar */}
                            <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden bg-zinc-800 shrink-0 shadow-md flex items-center justify-center font-archivo text-base font-bold text-orange-400">
                              {item.imageUri ? (
                                <Image
                                  src={item.imageUri}
                                  alt={item.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <span>{item.symbol.slice(0, 3)}</span>
                              )}
                            </div>

                            {/* Token Name, Ticker, Copy CA */}
                            <div className="min-w-0">
                              <h3 className="font-archivo text-base font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                                {item.name}
                              </h3>
                              <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 pt-0.5">
                                <span className="font-bold text-zinc-300">${item.symbol}</span>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.mint)}
                                  className="hover:text-orange-400 inline-flex items-center gap-0.5"
                                  title="Copy Mint Address (CA)"
                                >
                                  {copiedMint === item.mint ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{item.mint.slice(0, 4)}...{item.mint.slice(-4)}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Trending Rank Badge */}
                          <div className="shrink-0 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-xs font-bold text-zinc-300">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Caller Info & Time Badge */}
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => handleSelectCaller(item.creator)}
                            className="inline-flex items-center gap-1 hover:text-orange-400 transition-colors font-medium truncate max-w-[170px]"
                            title={`Filter calls by ${callerName}`}
                          >
                            <User className="w-3 h-3 text-orange-500 shrink-0" />
                            <span>Callout by <span className="font-bold text-zinc-200">{callerName}</span></span>
                          </button>

                          <div className="inline-flex items-center gap-1 shrink-0 text-zinc-400">
                            <Clock className="w-3 h-3" />
                            <span>{timeAgo}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Metrics Grid */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs">
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-bold">Market Cap</div>
                          <div className="font-bold text-white font-mono-num text-sm">
                            {item.marketCapUsd > 0 ? formatCurrency(item.marketCapUsd) : "$5.2K"}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-bold">24h Gain</div>
                          <div className={`font-black flex items-center gap-0.5 text-sm font-mono-num ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            <span>{item.priceChange24h > 0 ? `+${item.priceChange24h}%` : `${item.priceChange24h}%`}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase font-bold">Activity</div>
                          <div className="font-bold text-zinc-300 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-orange-500" />
                            <span>{item.replyCount} calls</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Action Buttons */}
                      <div className="pt-2 flex items-center gap-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleOpenBurnModal(item)}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>Boost with $BATON</span>
                        </button>

                        <a
                          href={item.pumpFunUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                          title="Trade on Pump.fun"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <a
                          href={item.dexScreenerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                          title="View on DexScreener"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 7. Callers Rewards Leaderboard View */}
        {activeTab === "callers" && (
          <TopCallersLeaderboard
            callers={callersLeaderboard}
            onSelectCaller={handleSelectCaller}
            selectedCaller={selectedCaller}
            onClearFilter={() => setSelectedCaller(null)}
          />
        )}

        {/* 8. Graduated Mints View */}
        {activeTab === "graduated" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {graduatedItems.map((item) => (
                <div
                  key={`grad-${item.id}`}
                  className="rounded-2xl border border-lime-400/30 bg-white dark:bg-[#15171C] p-5 space-y-4 shadow-md hover:border-lime-400 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-lime-400/10 text-lime-600 dark:text-lime-400 border border-lime-400/30 text-[10px] font-mono font-bold uppercase">
                      ✓ Raydium DEX Bonded
                    </span>
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(item.marketCapUsd)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs">
                      {item.imageUri ? (
                        <Image src={item.imageUri} alt={item.name} width={40} height={40} className="object-cover" unoptimized />
                      ) : (
                        item.symbol.slice(0, 3)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-archivo text-base font-bold text-zinc-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="font-mono text-xs text-zinc-400">${item.symbol}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-white/5 font-mono text-xs">
                    <a
                      href={item.dexScreenerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <span>DexScreener</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleOpenBurnModal(item)}
                      className="text-lime-600 dark:text-lime-400 font-bold hover:underline"
                    >
                      Boost Rank 🔥
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Burn & Boost Modal */}
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
