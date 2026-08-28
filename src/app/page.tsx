"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { BurnModal } from "@/components/BurnModal";
import { Coin } from "@/types/coin";
import { CalloutItem } from "@/app/api/callouts/route";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";
import { useRecentBurns } from "@/hooks/useRecentBurns";
import { formatNumber, formatCurrency } from "@/lib/utils";
import {
  Flame,
  Search,
  ExternalLink,
  ChevronDown,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Radio,
  Zap,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All", icon: "🪟" },
  { id: "Mascots", label: "Mascots", icon: "🎭" },
  { id: "Agents", label: "AI Agents", icon: "🤖" },
  { id: "Memes", label: "Memes", icon: "🐸" },
  { id: "Utility", label: "Utility", icon: "⚡" },
  { id: "DeFi", label: "DeFi", icon: "🏦" },
  { id: "Community", label: "Community", icon: "👥" },
];

export default function OutbidHomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [inputToken, setInputToken] = useState("");
  const [inputCategory, setInputCategory] = useState("Mascots");
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const [liveCallouts, setLiveCallouts] = useState<CalloutItem[]>([]);
  const [calloutsLoading, setCalloutsLoading] = useState<boolean>(true);

  const { coins, isLoading: coinsLoading, refresh } = useCoinsData(15_000);
  const { totalBurned, refresh: refreshStats } = useTokenStats(15_000);
  const { recentBurns, refresh: refreshBurns } = useRecentBurns(10_000);

  // Fetch live callouts for showcase
  const fetchTopCallouts = useCallback(async () => {
    try {
      const res = await fetch("/api/callouts", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setLiveCallouts(json.data.slice(0, 4));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch homepage callouts showcase", e);
    } finally {
      setCalloutsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopCallouts();
    const interval = setInterval(fetchTopCallouts, 12_000);
    return () => clearInterval(interval);
  }, [fetchTopCallouts]);

  const handleCopy = (mint: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  // Ranked coins ordered by totalBurnedBaton
  const rankedCoins = useMemo(() => {
    return [...coins].sort((a, b) => b.totalBurnedBaton - a.totalBurnedBaton);
  }, [coins]);

  // Filtered by selected category
  const filteredCoins = useMemo(() => {
    if (selectedCategory === "all") return rankedCoins;
    return rankedCoins.filter(
      (c) => c.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [rankedCoins, selectedCategory]);

  const top1Coin = rankedCoins[0];
  const top1Burn = top1Coin?.totalBurnedBaton || 0;
  const minRequiredToClaimRank1 = top1Burn === 0 ? 1000 : top1Burn + 1000;

  const [customBidAmount, setCustomBidAmount] = useState<number>(1000);

  // Ensure custom bid is always at least the minimum required to overtake #1
  useEffect(() => {
    setCustomBidAmount((prev) => Math.max(prev, minRequiredToClaimRank1));
  }, [minRequiredToClaimRank1]);

  const top3Coins = filteredCoins.slice(0, 3);
  const listCoins = filteredCoins.slice(3);

  const handleClaimRank = (targetCoin?: Coin) => {
    if (targetCoin) {
      setSelectedCoin(targetCoin);
      return;
    }

    if (inputToken.trim()) {
      const match = coins.find(
        (c) =>
          c.mintAddress.toLowerCase() === inputToken.trim().toLowerCase() ||
          c.ticker.toLowerCase() === inputToken.trim().toLowerCase()
      );
      if (match) {
        setSelectedCoin(match);
      } else {
        // Create candidate coin for burn modal
        setSelectedCoin({
          id: `custom-${Date.now()}`,
          name: inputToken.length > 12 ? `${inputToken.slice(0, 4)}...${inputToken.slice(-4)}` : inputToken,
          ticker: inputToken.toUpperCase().slice(0, 8),
          mintAddress: inputToken.length > 20 ? inputToken : "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
          iconColor: "#f97316",
          category: inputCategory,
          description: `Custom token bid under category ${inputCategory}`,
          marketCap: 0,
          volume24h: 0,
          change24h: 0,
          sparkline: [10, 15, 20],
          totalBurnedBaton: 0,
          burnLevel: "none",
        });
      }
    } else if (top1Coin) {
      setSelectedCoin(top1Coin);
    }
  };

  const handleBoostCallout = (item: CalloutItem, e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#0B0C0E] text-zinc-900 dark:text-white selection:bg-orange-500 selection:text-white font-space transition-colors">
      {/* 1. Outbid Navigation Bar */}
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10">
        {/* 2. Top Live Stats Pill */}
        <div className="flex justify-center">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#15171C] border border-zinc-200 dark:border-white/10 shadow-sm text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:border-orange-500/40 transition-all group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-zinc-900 dark:text-white">Live On-Chain Engine</span>
            <span className="text-zinc-400">•</span>
            <span>{Math.round(totalBurned).toLocaleString("en-US")} BATON burned</span>
            <span className="text-zinc-400">•</span>
            <span className="text-orange-500 font-bold group-hover:underline flex items-center gap-0.5">
              see stats <ArrowRight className="w-3 h-3 inline" />
            </span>
          </Link>
        </div>

        {/* 3. Hero Section: "Claim #1 for [X] BATON" */}
        <div className="text-center space-y-6 max-w-2xl mx-auto pt-2">
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="font-archivo text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
              Claim #1 for
            </h1>

            {/* Minus Button */}
            <button
              type="button"
              onClick={() =>
                setCustomBidAmount((prev) => Math.max(minRequiredToClaimRank1, prev - 1000))
              }
              disabled={customBidAmount <= minRequiredToClaimRank1}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
                customBidAmount <= minRequiredToClaimRank1
                  ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                  : "bg-zinc-200 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-zinc-700 dark:text-zinc-300"
              }`}
              title={
                customBidAmount <= minRequiredToClaimRank1
                  ? `Minimum required to overtake #1 is ${minRequiredToClaimRank1.toLocaleString("en-US")} BATON`
                  : "Decrease burn bid by 1,000 BATON"
              }
            >
              <Minus className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Dynamic Burn Amount in BATON */}
            <span className="font-archivo text-3xl sm:text-5xl font-black text-[#F97316] tracking-tight font-mono-num">
              {customBidAmount.toLocaleString("en-US")} BATON
            </span>

            {/* Plus Button */}
            <button
              type="button"
              onClick={() => setCustomBidAmount((prev) => prev + 1000)}
              className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all shadow-sm"
              title="Increase burn bid by 1,000 BATON"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Claim / Search Bar */}
          <div className="p-1.5 sm:p-2 rounded-2xl bg-white dark:bg-[#15171C] border border-zinc-200 dark:border-white/10 shadow-lg shadow-zinc-200/50 dark:shadow-black/60 flex flex-col sm:flex-row items-center gap-2">
            {/* Input */}
            <div className="flex-1 flex items-center gap-2.5 px-3 py-2 w-full">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Your token CA or @handle"
                className="w-full bg-transparent text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <select
                value={inputCategory}
                onChange={(e) => setInputCategory(e.target.value)}
                className="appearance-none w-full sm:w-auto bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-mono font-bold py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="Mascots">Mascots</option>
                <option value="Agents">AI Agents</option>
                <option value="Memes">Memes</option>
                <option value="Utility">Utility</option>
                <option value="DeFi">DeFi</option>
                <option value="Community">Community</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => handleClaimRank()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Claim rank</span>
            </button>
          </div>
        </div>

        {/* 4. ✨ YENİ DEV BÖLÜM: "🔥 PUMP.FUN CALLOUT REWARDS & LIVE ALPHA STREAM" */}
        <section className="relative rounded-3xl border border-orange-500/30 bg-white/90 dark:bg-[#0E1015]/90 p-5 sm:p-7 shadow-2xl shadow-orange-500/5 backdrop-blur-md space-y-5 overflow-hidden">
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-3xl"
            aria-hidden="true"
          />

          {/* Section Header */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80 dark:border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                  <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                  <span>Live DexScreener Stream</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white font-mono text-[9px] font-black tracking-wider">
                  10x REWARDS
                </span>
              </div>

              <h2 className="font-archivo text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                <span>🔥 LIVE PUMP.FUN CALLOUT STREAM</span>
              </h2>
              <p className="font-space text-xs text-zinc-500 dark:text-zinc-400">
                Real-time Solana tokens called by verified alpha hunters. Boost rank with $BATON.
              </p>
            </div>

            <Link
              href="/callouts"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white dark:text-orange-400 dark:hover:text-white border border-orange-500/30 font-mono text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <span>View All Top Callers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Callouts Live Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {calloutsLoading && liveCallouts.length === 0 ? (
              [1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="h-44 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 p-4 animate-pulse space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
                      <div className="h-2.5 w-14 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    </div>
                  </div>
                  <div className="h-12 bg-zinc-200/60 dark:bg-zinc-700/60 rounded-xl" />
                </div>
              ))
            ) : (
              liveCallouts.map((item, index) => {
                const isPositive = item.priceChange24h >= 0;
                return (
                  <div
                    key={item.id}
                    className="bg-[#13161C] border border-white/10 hover:border-orange-500/50 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 group"
                  >
                    {/* Top Row: Circular Logo, Name, Ticker, Copy CA */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
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

                        <div className="min-w-0">
                          <h3 className="font-archivo text-base font-bold text-white truncate group-hover:text-orange-400 transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 pt-0.5">
                            <span className="font-bold text-zinc-300">${item.symbol}</span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(item.mint, e)}
                              className="hover:text-orange-400 inline-flex items-center gap-0.5"
                              title="Copy CA"
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

                      <span className="shrink-0 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 font-mono text-xs font-bold text-zinc-300">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Live Statistics Row */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/5 font-mono">
                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase font-bold">Market Cap</div>
                        <div className="font-bold text-white font-mono-num text-sm sm:text-base">
                          {item.marketCapUsd > 0 ? formatCurrency(item.marketCapUsd) : "$8.4K"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-zinc-400 uppercase font-bold">24h Gain</div>
                        <div className={`font-black flex items-center gap-0.5 text-sm sm:text-base font-mono-num ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{item.priceChange24h > 0 ? `+${item.priceChange24h}%` : `${item.priceChange24h}%`}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Boost with $BATON + Dex/Pump External Links */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={(e) => handleBoostCallout(item, e)}
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
                        title="View DexScreener Chart"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 5. Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#F97316] text-white shadow-sm shadow-orange-500/30"
                    : "bg-white dark:bg-[#15171C] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 6. Top Featured Outbid Podium Cards */}
        <div className="space-y-4">
          {top3Coins.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#15171C] border border-dashed border-zinc-300 dark:border-white/10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                <Flame className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-archivo text-lg font-bold text-zinc-900 dark:text-white">
                  No projects listed in {selectedCategory === "all" ? "this category" : selectedCategory} yet
                </h3>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  Be the first community to claim #1 rank by burning $BATON or submitting your project.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleClaimRank()}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-orange-500/20"
              >
                Claim #1 Rank Now 🔥
              </button>
            </div>
          ) : (
            top3Coins.map((coin, index) => {
              const rank = index + 1;
              const isRank1 = rank === 1;

              return (
                <div
                  key={coin.id}
                  onClick={() => handleClaimRank(coin)}
                  className={`group relative rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer ${
                    isRank1
                      ? "bg-[#FFF8F3] dark:bg-[#1A1412] border-2 border-orange-500/60 shadow-lg shadow-orange-500/10 hover:border-orange-500"
                      : "bg-white dark:bg-[#15171C] border border-zinc-200 dark:border-white/10 shadow-sm hover:border-zinc-300 dark:hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Rank Badge + Avatar + Title & Meta */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-archivo text-sm font-black shrink-0 ${
                          isRank1
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                            : rank === 2
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400"
                        }`}
                      >
                        #{rank}
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center font-archivo text-base font-bold shrink-0 shadow-inner"
                        style={{
                          backgroundColor: `${coin.iconColor}20`,
                          color: coin.iconColor,
                          border: `1px solid ${coin.iconColor}40`,
                        }}
                      >
                        {coin.imageUrl ? (
                          <Image
                            src={coin.imageUrl}
                            alt={coin.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span>{coin.ticker.slice(0, 3)}</span>
                        )}
                      </div>

                      {/* Name, Category, Links */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-archivo text-base sm:text-lg font-bold text-zinc-900 dark:text-white truncate">
                            {coin.name}
                          </h3>
                          <span className="font-mono text-xs text-zinc-400">
                            ${coin.ticker}
                          </span>
                          {coin.category && (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono font-semibold uppercase">
                              {coin.category}
                            </span>
                          )}
                          {isRank1 && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              #1 Outbid Leader
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-space text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {coin.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Burned Metric & Action Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-white/5">
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] font-mono uppercase text-zinc-400">
                          Total Burned
                        </div>
                        <div className="font-archivo text-base sm:text-lg font-black text-orange-500 font-mono-num flex items-center gap-1 sm:justify-end">
                          <Flame className="w-4 h-4 fill-current text-orange-500" />
                          <span>{coin.totalBurnedBaton.toLocaleString("en-US")} BATON</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimRank(coin);
                        }}
                        className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                          isRank1
                            ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500"
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>Outbid</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 7. Remaining Standard Leaderboard Coins */}
        {listCoins.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#15171C] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <span className="font-archivo text-sm font-bold text-zinc-900 dark:text-white">
                All Ranked Projects
              </span>
              <span className="font-mono text-xs text-zinc-400">
                {listCoins.length} projects listed
              </span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-white/5 font-mono text-xs">
              {listCoins.map((coin, index) => {
                const rank = index + 4;
                return (
                  <div
                    key={coin.id}
                    onClick={() => handleClaimRank(coin)}
                    className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-zinc-400 font-bold text-center">
                        #{rank}
                      </span>
                      <div
                        className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center font-bold text-xs shrink-0"
                        style={{
                          backgroundColor: `${coin.iconColor}20`,
                          color: coin.iconColor,
                        }}
                      >
                        {coin.imageUrl ? (
                          <Image
                            src={coin.imageUrl}
                            alt={coin.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span>{coin.ticker.slice(0, 2)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 dark:text-white truncate">
                          {coin.name}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          ${coin.ticker}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right font-mono-num font-bold text-orange-500">
                        {coin.totalBurnedBaton.toLocaleString("en-US")} BATON
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimRank(coin);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all"
                      >
                        Outbid
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Burn & Outbid Modal */}
      {selectedCoin && (
        <BurnModal
          coin={selectedCoin}
          isOpen={!!selectedCoin}
          initialAmount={customBidAmount}
          onClose={() => setSelectedCoin(null)}
          onSuccess={() => {
            setSelectedCoin(null);
            refresh();
            refreshStats();
            refreshBurns();
          }}
        />
      )}
    </div>
  );
}
