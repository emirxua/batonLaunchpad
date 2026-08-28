"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Ticker } from "@/components/Ticker";
import { Navbar } from "@/components/Navbar";
import { TierBadge } from "@/components/TierBadge";
import { BurnModal } from "@/components/BurnModal";
import { RecentBurns } from "@/components/RecentBurns";
import { Coin } from "@/types/coin";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";
import { useRecentBurns } from "@/hooks/useRecentBurns";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserBatonBalance } from "@/hooks/useUserBatonBalance";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getBurnLevel } from "@/lib/burn-levels";
import {
  Trophy,
  Flame,
  Crown,
  Medal,
  Wallet,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

type TimeRange = "all-time" | "this-week" | "today";

export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all-time");
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  const { coins, isLoading: coinsLoading, refresh } = useCoinsData(15_000);
  const { totalBurned, refresh: refreshStats } = useTokenStats(15_000);
  const { recentBurns, totalRecordedBurns, refresh: refreshBurns, isLoading: burnsLoading } = useRecentBurns(10_000);
  const { publicKey, connected } = useWallet();
  const { batonBalance } = useUserBatonBalance();

  // Calculate user's personal burn contributions from verified on-chain burns
  const userBurnTotal = useMemo(() => {
    if (!publicKey) return 0;
    const pubkeyStr = publicKey.toBase58().toLowerCase();
    return recentBurns
      .filter((b) => b.userAddress.toLowerCase() === pubkeyStr)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [publicKey, recentBurns]);

  // Adjusted coin burn calculations based on time range filter
  const rankedCoins = useMemo(() => {
    return [...coins].map((coin) => {
      let multiplier = 1;
      if (timeRange === "this-week") multiplier = 0.28;
      if (timeRange === "today") multiplier = 0.065;

      const baseBurn = coin.ticker === "BATON" ? totalBurned : coin.totalBurnedBaton;
      const adjustedBurn = Math.floor(baseBurn * multiplier);

      return {
        ...coin,
        totalBurnedBaton: baseBurn,
        timeAdjustedBurn: adjustedBurn,
        burnLevel: getBurnLevel(adjustedBurn),
      };
    }).sort((a, b) => b.timeAdjustedBurn - a.timeAdjustedBurn);
  }, [coins, timeRange, totalBurned]);

  const top3Coins = rankedCoins.slice(0, 3);

  // Total Platform Burn for current view
  const totalBurnedInView = rankedCoins.reduce(
    (acc, c) => acc + c.timeAdjustedBurn,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text selection:bg-acid selection:text-bg">
      {/* 1. Top Acid Ticker */}
      <Ticker />

      {/* 2. Main Navbar */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Header Section */}
        <section className="relative rounded-3xl border border-zinc-200/80 dark:border-line bg-gradient-to-b from-white via-zinc-50 to-white dark:from-bg-raised dark:to-bg p-8 sm:p-12 overflow-hidden text-center max-w-4xl mx-auto space-y-4 shadow-xl shadow-zinc-200/30 dark:shadow-none">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-magenta/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-acid/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-300 dark:border-acid/30 bg-emerald-50 dark:bg-acid/10 text-emerald-700 dark:text-acid font-mono text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>VERIFIED ON-CHAIN RANKINGS</span>
          </div>

          <h1 className="font-archivo text-3xl sm:text-5xl lg:text-6xl text-zinc-900 dark:text-text tracking-tight uppercase leading-tight">
            BURN <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-acid dark:via-lime-400 dark:to-acid bg-clip-text text-transparent">LEADERBOARD</span>
          </h1>

          <p className="font-space text-sm sm:text-base text-zinc-600 dark:text-text-dim max-w-xl mx-auto leading-relaxed">
            The top Solana communities ranked by total <span className="text-emerald-600 dark:text-acid font-bold">$BATON</span> burned on-chain.
          </p>

          {/* Time Filter Tabs */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-bg-card border border-zinc-200/80 dark:border-line font-mono text-xs shadow-sm">
              {[
                { key: "all-time", label: "All-Time" },
                { key: "this-week", label: "This Week" },
                { key: "today", label: "Today" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTimeRange(tab.key as TimeRange)}
                  className={`px-4 py-2 rounded-xl transition-all duration-150 font-bold uppercase tracking-wider ${
                    timeRange === tab.key
                      ? "bg-zinc-900 dark:bg-acid text-white dark:text-bg shadow-sm"
                      : "text-zinc-500 dark:text-text-dim hover:text-zinc-900 dark:hover:text-text"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Podium Champions */}
        {top3Coins.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-archivo text-xl text-zinc-900 dark:text-text flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#ffd700]" />
                <span>Podium &amp; League Champions</span>
              </h2>
              <span className="font-mono text-xs text-zinc-500 dark:text-text-faint">
                {timeRange === "all-time"
                  ? "All-Time Burn Total"
                  : timeRange === "this-week"
                  ? "Weekly Volume"
                  : "Daily Volume"}
              </span>
            </div>

            <div className={`grid grid-cols-1 ${top3Coins.length >= 3 ? "md:grid-cols-3" : top3Coins.length === 2 ? "md:grid-cols-2" : "max-w-md mx-auto"} gap-6 pt-2`}>
              {/* #2 Silver */}
              {top3Coins[1] && (
                <div className="order-2 md:order-1 rounded-2xl border border-zinc-200/80 dark:border-[#c0c0c0]/40 bg-white/85 dark:bg-bg-card p-6 flex flex-col justify-between relative shadow-lg shadow-zinc-200/40 dark:shadow-[0_0_25px_rgba(192,192,192,0.1)] hover:-translate-y-1 transition-all">
                  <div className="absolute -top-3.5 left-6 px-3 py-1 rounded-full bg-[#c0c0c0] text-[#0a0b0d] font-mono text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5" />
                    <span>#02 SILVER</span>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-archivo text-base font-bold"
                          style={{
                            backgroundColor: `${top3Coins[1].iconColor}20`,
                            color: top3Coins[1].iconColor,
                            border: `1px solid ${top3Coins[1].iconColor}40`,
                          }}
                        >
                          {top3Coins[1].ticker.slice(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-archivo text-lg text-zinc-900 dark:text-text">
                            {top3Coins[1].name}
                          </h3>
                          <span className="font-mono text-xs text-zinc-500 dark:text-text-dim">
                            ${top3Coins[1].ticker}
                          </span>
                        </div>
                      </div>
                      <TierBadge level={top3Coins[1].burnLevel} />
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-bg-raised font-mono text-xs space-y-1 border border-zinc-200/60 dark:border-line/40">
                      <div className="text-zinc-500 dark:text-text-faint text-[10px] uppercase font-bold">
                        Burned Total
                      </div>
                      <div className="text-xl font-black text-emerald-600 dark:text-acid font-mono-num">
                        {formatNumber(top3Coins[1].timeAdjustedBurn)}{" "}
                        <span className="text-xs text-zinc-500 dark:text-text-dim">$BATON</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCoin(top3Coins[1])}
                    className="mt-4 w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-bg-raised text-white dark:text-acid border border-zinc-900 dark:border-acid/30 font-mono text-xs font-bold hover:bg-emerald-600 dark:hover:bg-acid dark:hover:text-bg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Flame className="w-3.5 h-3.5 fill-current text-rose-400 dark:text-acid" />
                    <span>Burn &amp; Boost</span>
                  </button>
                </div>
              )}

              {/* #1 Gold Champion */}
              {top3Coins[0] && (
                <div className="order-1 md:order-2 rounded-2xl border-2 border-[#ffd700]/70 bg-gradient-to-b from-[#ffd700]/15 via-white dark:via-bg-card to-white dark:to-bg-card p-6 sm:p-7 flex flex-col justify-between relative shadow-xl shadow-amber-500/10 dark:shadow-[0_0_35px_rgba(255,215,0,0.2)] md:-translate-y-3 hover:-translate-y-4 transition-all">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#ffd700] text-[#0a0b0d] font-mono text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 animate-pulse">
                    <Crown className="w-4 h-4 fill-current" />
                    <span>#01 CHAMPION</span>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center font-archivo text-xl font-black shadow-inner"
                          style={{
                            backgroundColor: `${top3Coins[0].iconColor}25`,
                            color: top3Coins[0].iconColor,
                            border: `2px solid ${top3Coins[0].iconColor}60`,
                          }}
                        >
                          {top3Coins[0].ticker.slice(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-archivo text-xl text-zinc-900 dark:text-text">
                            {top3Coins[0].name}
                          </h3>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-[#ffd700]">
                            ${top3Coins[0].ticker}
                          </span>
                        </div>
                      </div>
                      <TierBadge level={top3Coins[0].burnLevel} />
                    </div>

                    <div className="p-4 rounded-xl bg-white/90 dark:bg-bg-raised/90 border border-[#ffd700]/30 font-mono text-xs space-y-1 shadow-sm">
                      <div className="text-amber-600 dark:text-[#ffd700] text-[11px] uppercase font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>Leader Burn Score</span>
                      </div>
                      <div className="text-2xl font-black text-emerald-600 dark:text-acid font-mono-num">
                        {formatNumber(top3Coins[0].timeAdjustedBurn)}{" "}
                        <span className="text-xs text-zinc-500 dark:text-text-dim">$BATON</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCoin(top3Coins[0])}
                    className="mt-4 w-full py-3 rounded-xl bg-zinc-900 dark:bg-acid text-white dark:text-bg font-mono text-xs font-black uppercase tracking-wider shadow-md hover:bg-emerald-600 dark:hover:bg-acid-dim transition-all flex items-center justify-center gap-2"
                  >
                    <Flame className="w-4 h-4 fill-current text-rose-400 dark:text-bg" />
                    <span>Burn $BATON for Leader 🔥</span>
                  </button>
                </div>
              )}

              {/* #3 Bronze */}
              {top3Coins[2] && (
                <div className="order-3 rounded-2xl border border-zinc-200/80 dark:border-[#cd7f32]/40 bg-white/85 dark:bg-bg-card p-6 flex flex-col justify-between relative shadow-lg shadow-zinc-200/40 dark:shadow-[0_0_25px_rgba(205,127,50,0.1)] hover:-translate-y-1 transition-all">
                  <div className="absolute -top-3.5 left-6 px-3 py-1 rounded-full bg-[#cd7f32] text-white font-mono text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5" />
                    <span>#03 BRONZE</span>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-archivo text-base font-bold"
                          style={{
                            backgroundColor: `${top3Coins[2].iconColor}20`,
                            color: top3Coins[2].iconColor,
                            border: `1px solid ${top3Coins[2].iconColor}40`,
                          }}
                        >
                          {top3Coins[2].ticker.slice(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-archivo text-lg text-zinc-900 dark:text-text">
                            {top3Coins[2].name}
                          </h3>
                          <span className="font-mono text-xs text-zinc-500 dark:text-text-dim">
                            ${top3Coins[2].ticker}
                          </span>
                        </div>
                      </div>
                      <TierBadge level={top3Coins[2].burnLevel} />
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-bg-raised font-mono text-xs space-y-1 border border-zinc-200/60 dark:border-line/40">
                      <div className="text-zinc-500 dark:text-text-faint text-[10px] uppercase font-bold">
                        Burned Total
                      </div>
                      <div className="text-xl font-black text-emerald-600 dark:text-acid font-mono-num">
                        {formatNumber(top3Coins[2].timeAdjustedBurn)}{" "}
                        <span className="text-xs text-zinc-500 dark:text-text-dim">$BATON</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCoin(top3Coins[2])}
                    className="mt-4 w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-bg-raised text-white dark:text-acid border border-zinc-900 dark:border-acid/30 font-mono text-xs font-bold hover:bg-emerald-600 dark:hover:bg-acid dark:hover:text-bg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Flame className="w-3.5 h-3.5 fill-current text-rose-400 dark:text-acid" />
                    <span>Burn &amp; Boost</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Full Leaderboard Table */}
        <section className="rounded-3xl border border-zinc-200/80 dark:border-line bg-white/85 dark:bg-bg-card overflow-hidden shadow-xl shadow-zinc-200/30 dark:shadow-none space-y-4 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-line">
            <div>
              <h2 className="font-archivo text-xl text-zinc-900 dark:text-text">Full Rankings</h2>
              <p className="font-mono text-xs text-zinc-500 dark:text-text-dim">
                Solana mascot tokens ordered by genuine on-chain burn volume
              </p>
            </div>

            <div className="font-mono text-xs text-emerald-700 dark:text-acid bg-emerald-50 dark:bg-acid/10 border border-emerald-200 dark:border-acid/20 px-3 py-1.5 rounded-xl w-max font-bold">
              Total Burned in View: {formatNumber(totalBurnedInView)} $BATON
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-zinc-400 dark:text-text-faint uppercase text-[11px] border-b border-zinc-200/80 dark:border-line/60">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Coin</th>
                  <th className="py-3 px-3">Tier</th>
                  <th className="py-3 px-3">Market Cap</th>
                  <th className="py-3 px-3 text-right">Burned $BATON</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:divide-line/40">
                {rankedCoins.map((coin, index) => {
                  const rank = index + 1;
                  const rankStr = rank < 10 ? `0${rank}` : `${rank}`;

                  let rankBadgeColor = "text-zinc-500 dark:text-text-dim";
                  if (rank === 1) rankBadgeColor = "text-amber-500 dark:text-[#ffd700] font-black";
                  if (rank === 2) rankBadgeColor = "text-zinc-400 dark:text-[#c0c0c0] font-black";
                  if (rank === 3) rankBadgeColor = "text-amber-700 dark:text-[#cd7f32] font-black";

                  return (
                    <tr
                      key={coin.id}
                      className="hover:bg-zinc-50 dark:hover:bg-bg-raised/50 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-4 px-3">
                        <span className={`text-sm font-bold ${rankBadgeColor}`}>
                          {rankStr}
                        </span>
                      </td>

                      {/* Coin Info */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-archivo text-xs font-bold shrink-0 shadow-inner"
                            style={{
                              backgroundColor: `${coin.iconColor}20`,
                              color: coin.iconColor,
                              border: `1px solid ${coin.iconColor}40`,
                            }}
                          >
                            {coin.ticker.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-archivo text-sm text-zinc-900 dark:text-text group-hover:text-emerald-600 dark:group-hover:text-acid transition-colors">
                              {coin.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-text-dim">
                              ${coin.ticker}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Level Badge */}
                      <td className="py-4 px-3">
                        <TierBadge level={coin.burnLevel} />
                      </td>

                      {/* Market Cap */}
                      <td className="py-4 px-3 font-semibold text-zinc-800 dark:text-text">
                        {formatCurrency(coin.marketCap)}
                      </td>

                      {/* Total Burned */}
                      <td className="py-4 px-3 text-right">
                        <div className="text-base font-black text-emerald-600 dark:text-acid font-mono-num">
                          {formatNumber(coin.timeAdjustedBurn)}
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-text-faint uppercase font-bold">
                          $BATON
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCoin(coin)}
                          className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-bg-raised text-white dark:text-acid border border-zinc-900 dark:border-acid/30 hover:bg-emerald-600 dark:hover:bg-acid dark:hover:text-bg font-bold text-xs transition-all shadow-sm active:scale-95 inline-flex items-center gap-1"
                        >
                          <Flame className="w-3 h-3 fill-current text-rose-400 dark:text-acid" />
                          <span>Burn</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live Recent Burn Transactions Section */}
        <RecentBurns
          burns={recentBurns}
          isLoading={burnsLoading}
          onRefresh={refreshBurns}
        />

        {/* 5. Personal Scorecard Panel */}
        <section className="rounded-3xl border border-zinc-200/80 dark:border-line bg-gradient-to-r from-white via-zinc-50 to-white dark:from-bg-card dark:via-bg-raised dark:to-bg-card p-6 sm:p-8 space-y-6 shadow-xl shadow-zinc-200/30 dark:shadow-none font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-acid/10 border border-emerald-200 dark:border-acid/30 text-emerald-600 dark:text-acid flex items-center justify-center shadow-sm">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-archivo text-xl text-zinc-900 dark:text-text">
                  Personal Burn Scorecard
                </h3>
                <p className="text-xs text-zinc-500 dark:text-text-dim">
                  Your connected wallet&apos;s verified on-chain contributions to $BATON Launchpad
                </p>
              </div>
            </div>

            {connected && publicKey && (
              <div className="text-xs text-emerald-700 dark:text-acid bg-emerald-50 dark:bg-acid/10 border border-emerald-200 dark:border-acid/20 px-3 py-1.5 rounded-xl w-max font-bold">
                Connected: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </div>
            )}
          </div>

          {connected ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-line bg-white dark:bg-bg-card space-y-1 shadow-sm">
                <span className="text-[11px] text-zinc-500 dark:text-text-faint uppercase font-bold">
                  Available $BATON Balance
                </span>
                <div className="text-2xl font-black text-zinc-900 dark:text-text font-mono-num">
                  {(batonBalance ?? 0).toLocaleString()} <span className="text-xs text-emerald-600 dark:text-acid">$BATON</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-line bg-white dark:bg-bg-card space-y-1 shadow-sm">
                <span className="text-[11px] text-zinc-500 dark:text-text-faint uppercase font-bold">
                  Total Burn Contribution
                </span>
                <div className="text-2xl font-black text-rose-600 dark:text-acid font-mono-num">
                  {userBurnTotal > 0 ? userBurnTotal.toLocaleString() : "0"}{" "}
                  <span className="text-xs text-zinc-500 dark:text-text-dim">$BATON</span>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-text-dim">
                  {userBurnTotal > 0 ? "★ Active Contributor" : "No burns yet from this wallet"}
                </span>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-line bg-white dark:bg-bg-card space-y-1 shadow-sm">
                <span className="text-[11px] text-zinc-500 dark:text-text-faint uppercase font-bold">
                  Community Badge
                </span>
                <div className="text-xl font-bold text-amber-600 dark:text-[#ffd700] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{userBurnTotal >= 50000 ? "Gold Supporter" : userBurnTotal >= 10000 ? "Silver Supporter" : userBurnTotal > 0 ? "Bronze Supporter" : "Mascot Scout"}</span>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-text-dim">
                  {userBurnTotal > 0 ? "Verified On-Chain Supporter" : "Burn $BATON to unlock tier badge"}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-line text-center space-y-3">
              <p className="text-xs text-zinc-500 dark:text-text-dim max-w-md mx-auto">
                Connect your Solana wallet to view your personal burn scorecard and rank contributions.
              </p>
            </div>
          )}
        </section>

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
            <span>$BATON Launchpad • Community Burn Leaderboard</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-600 dark:text-text-dim">
            <a
              href="https://x.com/buybaton"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-acid transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@buybaton</span>
            </a>
            <span>•</span>
            <Link href="/" className="text-zinc-600 dark:text-text-dim hover:text-emerald-600 dark:hover:text-acid transition-colors">
              ← Return to Directory
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
