"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { BurnModal } from "@/components/BurnModal";
import { Coin } from "@/types/coin";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";
import { useRecentBurns } from "@/hooks/useRecentBurns";
import { formatNumber } from "@/lib/utils";
import {
  Flame,
  Search,
  ExternalLink,
  ChevronDown,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
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

  const { coins, isLoading: coinsLoading, refresh } = useCoinsData(15_000);
  const { totalBurned, refresh: refreshStats } = useTokenStats(15_000);
  const { recentBurns, refresh: refreshBurns } = useRecentBurns(10_000);

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
            <span>{Math.round(totalBurned).toLocaleString()} total burned $BATON</span>
            <span className="text-zinc-400">•</span>
            <span className="text-orange-500 font-bold group-hover:underline flex items-center gap-0.5">
              see stats <ArrowRight className="w-3 h-3 inline" />
            </span>
          </Link>
        </div>

        {/* 3. Hero Section: "Claim #1 for [X] $BATON" (Dynamic Burn Bidding) */}
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
                  ? `Minimum required to overtake #1 is ${minRequiredToClaimRank1.toLocaleString()} $BATON`
                  : "Decrease burn bid by 1,000 $BATON"
              }
            >
              <Minus className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Dynamic Burn Amount in $BATON */}
            <span className="font-archivo text-3xl sm:text-5xl font-black text-[#F97316] tracking-tight font-mono-num">
              {customBidAmount.toLocaleString()} $BATON
            </span>

            {/* Plus Button */}
            <button
              type="button"
              onClick={() => setCustomBidAmount((prev) => prev + 1000)}
              className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all shadow-sm"
              title="Increase burn bid by 1,000 $BATON"
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
                className="w-full sm:w-auto appearance-none bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2.5 pr-8 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
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

        {/* 4. Category Filter Pills */}
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

        {/* 5. Top Featured Outbid Podium Cards */}
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

                      {/* Info */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-archivo text-base sm:text-lg font-bold text-zinc-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                            {coin.name}
                          </h3>
                          <span className="font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400">
                            ${coin.ticker}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-lg">
                          {coin.description || "Solana verified community token. Burn $BATON to overtake rank."}
                        </p>

                        {/* Meta Tags Row */}
                        <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 flex-wrap pt-0.5">
                          <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 font-semibold">
                            🏷 {coin.category || "Mascots"}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Verified SPL Asset</span>
                          <span>•</span>
                          <a
                            href={`https://pump.fun/coin/${coin.mintAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-orange-500 hover:underline inline-flex items-center gap-0.5 font-bold"
                          >
                            pump.fun <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right: Burned Score & Outbid Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 font-mono">
                      <div className="text-left sm:text-right">
                        <div className="text-lg sm:text-2xl font-black text-orange-500 font-mono-num">
                          {coin.totalBurnedBaton > 0
                            ? `${coin.totalBurnedBaton.toLocaleString()} $BATON`
                            : "0 $BATON"}
                        </div>
                        <div className="text-[10px] text-zinc-400 uppercase font-bold">
                          Total Burn Score
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimRank(coin);
                        }}
                        className="px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white dark:text-orange-400 dark:hover:text-white border border-orange-500/30 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
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

        {/* 6. Today's Top Ranking Mini Cards */}
        {top3Coins.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-zinc-500 uppercase tracking-wider">Today&apos;s Top Ranking</span>
              <Link href="/leaderboard" className="text-orange-500 hover:underline font-bold">
                See all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {top3Coins.map((c, i) => (
                <div
                  key={`today-${c.id}`}
                  onClick={() => handleClaimRank(c)}
                  className="p-3 rounded-xl bg-white dark:bg-[#15171C] border border-zinc-200 dark:border-white/10 flex items-center gap-3 cursor-pointer hover:border-orange-500/40 transition-all"
                >
                  <span className="font-mono text-xs font-bold text-zinc-400">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {c.imageUrl ? (
                      <Image src={c.imageUrl} alt={c.name} width={32} height={32} className="object-cover" unoptimized />
                    ) : (
                      c.ticker.slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {c.name}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-orange-500">
                      {c.totalBurnedBaton > 0 ? `${formatNumber(c.totalBurnedBaton)} $BATON` : "0 $BATON"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Latest Activity Live Strip */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="uppercase tracking-wider">Latest Activity</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recentBurns.length === 0 ? (
              <div className="p-3 rounded-xl bg-white dark:bg-[#15171C] border border-dashed border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-500">
                ⚡ Ready for first bid! Burn $BATON to claim rank.
              </div>
            ) : (
              recentBurns.slice(0, 6).map((burn) => (
                <a
                  key={burn.id}
                  href={`https://solscan.io/tx/${burn.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white dark:bg-[#15171C] border border-zinc-200 dark:border-white/10 shadow-sm flex items-center gap-2.5 shrink-0 hover:border-orange-500/40 transition-all font-mono text-xs"
                >
                  <Flame className="w-4 h-4 text-rose-500 fill-current" />
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                      <span>{burn.coinName || "Baton"}</span>
                      <span className="text-orange-500 font-black">+{formatNumber(burn.amount)}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      by {burn.userAddress.slice(0, 4)}...{burn.userAddress.slice(-4)}
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* 8. Ranks #4 and Beyond */}
        {listCoins.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="divide-y divide-zinc-200/80 dark:divide-white/5">
              {listCoins.map((coin, idx) => {
                const rank = idx + 4;
                return (
                  <div
                    key={coin.id}
                    onClick={() => handleClaimRank(coin)}
                    className="py-4 px-2 sm:px-4 rounded-xl flex items-center justify-between gap-4 hover:bg-white dark:hover:bg-[#15171C] transition-colors cursor-pointer group"
                  >
                    {/* Rank & Token Info */}
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span className="font-mono text-sm font-bold text-zinc-400 w-7 shrink-0">
                        #{rank}
                      </span>

                      <div
                        className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-xs shrink-0 shadow-inner"
                        style={{
                          backgroundColor: `${coin.iconColor}20`,
                          color: coin.iconColor,
                        }}
                      >
                        {coin.imageUrl ? (
                          <Image src={coin.imageUrl} alt={coin.name} width={40} height={40} className="object-cover" unoptimized />
                        ) : (
                          coin.ticker.slice(0, 3)
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-archivo text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate group-hover:text-orange-500 transition-colors">
                            {coin.name}
                          </h4>
                          <span className="font-mono text-xs text-zinc-500">
                            ${coin.ticker}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 pt-0.5">
                          <span>🏷 {coin.category || "General"}</span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Verified SPL Asset</span>
                        </div>
                      </div>
                    </div>

                    {/* Score & Action */}
                    <div className="flex items-center gap-4 shrink-0 font-mono">
                      <div className="text-right">
                        <div className="text-base font-black text-orange-500 font-mono-num">
                          {coin.totalBurnedBaton > 0 ? `${coin.totalBurnedBaton.toLocaleString()} $BATON` : "0 $BATON"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimRank(coin);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white text-xs font-bold transition-all"
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

        {/* 9. Launchpad Hub Floating Banner */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white shadow-xl shadow-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-mono font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Full Launchpad &amp; Mascot Engine</span>
            </div>
            <h2 className="font-archivo text-2xl sm:text-3xl font-black uppercase">
              Explore the $BATON Launchpad Hub
            </h2>
            <p className="text-sm text-white/90 font-space max-w-lg">
              Detailed holder distributions, deflationary supply tracking, and pump.fun verified mascot listings.
            </p>
          </div>

          <Link
            href="/launchpad"
            className="px-6 py-3.5 rounded-2xl bg-white text-zinc-900 font-mono text-xs font-black uppercase tracking-wider shadow-lg hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-2"
          >
            <span>Open Launchpad Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* SPL Token Burn / Outbid Modal */}
        <BurnModal
          coin={selectedCoin}
          isOpen={!!selectedCoin}
          initialAmount={customBidAmount}
          onClose={() => setSelectedCoin(null)}
          onSuccess={() => {
            refresh();
            refreshStats();
            refreshBurns();
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0E1013] py-8 mt-16 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>outbid.baton • Solana On-Chain Bidding &amp; Burn Engine</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
            <Link href="/launchpad" className="hover:text-orange-500 transition-colors">
              Launchpad Hub
            </Link>
            <span>•</span>
            <Link href="/leaderboard" className="hover:text-orange-500 transition-colors">
              Leaderboard
            </Link>
            <span>•</span>
            <a
              href="https://x.com/buybaton"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 transition-colors"
            >
              @buybaton
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
