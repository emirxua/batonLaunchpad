"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Ticker } from "@/components/Ticker";
import { Navbar } from "@/components/Navbar";
import { TierBadge } from "@/components/TierBadge";
import { BurnModal } from "@/components/BurnModal";
import { Coin } from "@/types/coin";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserBatonBalance } from "@/hooks/useUserBatonBalance";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getBurnLevel } from "@/lib/burn-levels";
import {
  Trophy,
  Flame,
  Crown,
  Medal,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type TimeRange = "all-time" | "this-week" | "today";

export default function LeaderboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all-time");
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  const { coins, isLoading, refresh } = useCoinsData(15_000);
  const { totalBurned, refresh: refreshStats } = useTokenStats(15_000);
  const { publicKey, connected } = useWallet();
  const { batonBalance, solBalance } = useUserBatonBalance();

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
  const remainingCoins = rankedCoins.slice(3);

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
        <section className="relative rounded-3xl border border-line bg-gradient-to-b from-bg-raised to-bg p-8 sm:p-12 overflow-hidden text-center max-w-4xl mx-auto space-y-4">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-magenta/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-acid/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-acid/30 bg-acid/10 text-acid font-mono text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>SOLANA COMMUNITY RANKINGS</span>
          </div>

          <h1 className="font-archivo text-3xl sm:text-5xl lg:text-6xl text-text tracking-tight uppercase leading-tight">
            BURN <span className="text-acid">LEADERBOARD</span>
          </h1>

          <p className="font-space text-sm sm:text-base text-text-dim max-w-xl mx-auto leading-relaxed">
            The top Solana communities ranked by total <span className="text-acid font-semibold">$BATON</span> burned.
          </p>

          {/* Time Filter Tabs */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex p-1.5 rounded-2xl bg-bg-card border border-line font-mono text-xs">
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
                      ? "bg-acid text-bg shadow-[0_0_12px_rgba(212,255,63,0.25)]"
                      : "text-text-dim hover:text-text"
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
              <h2 className="font-archivo text-xl text-text flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#ffd700]" />
                <span>Podium &amp; League Champions</span>
              </h2>
              <span className="font-mono text-xs text-text-faint">
                {timeRange === "all-time"
                  ? "All-Time Burn Total"
                  : timeRange === "this-week"
                  ? "Weekly Volume"
                  : "Daily Volume"}
              </span>
            </div>

            <div className={`grid grid-cols-1 ${top3Coins.length >= 3 ? "md:grid-cols-3" : top3Coins.length === 2 ? "md:grid-cols-2" : "max-w-md mx-auto"} gap-6 pt-2`}>
              {/* #2 Silver (if exists) */}
              {top3Coins[1] && (
                <div className="order-2 md:order-1 rounded-2xl border border-[#c0c0c0]/40 bg-bg-card p-6 flex flex-col justify-between relative shadow-[0_0_25px_rgba(192,192,192,0.1)] hover:-translate-y-1 transition-all">
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
                          <h3 className="font-archivo text-lg text-text">
                            {top3Coins[1].name}
                          </h3>
                          <span className="font-mono text-xs text-text-dim">
                            ${top3Coins[1].ticker}
                          </span>
                        </div>
                      </div>
                      <TierBadge level={top3Coins[1].burnLevel} />
                    </div>

                    <div className="p-3 rounded-xl bg-bg-raised font-mono text-xs space-y-1">
                      <div className="text-text-faint text-[10px] uppercase">
                        Burned Total
                      </div>
                      <div className="text-xl font-bold text-acid">
                        {formatNumber(top3Coins[1].timeAdjustedBurn)}{" "}
                        <span className="text-xs">$BATON</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCoin(top3Coins[1])}
                    className="mt-4 w-full py-2.5 rounded-xl bg-bg-raised border border-acid/30 text-acid font-mono text-xs font-bold hover:bg-acid hover:text-bg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>Burn &amp; Boost</span>
                  </button>
                </div>
              )}

              {/* #1 Gold Champion (Center & Elevated) */}
              {top3Coins[0] && (
                <div className="order-1 md:order-2 rounded-2xl border-2 border-[#ffd700]/60 bg-gradient-to-b from-[#ffd700]/10 via-bg-card to-bg-card p-6 sm:p-7 flex flex-col justify-between relative shadow-[0_0_35px_rgba(255,215,0,0.2)] md:-translate-y-3 hover:-translate-y-4 transition-all">
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
                          <h3 className="font-archivo text-xl text-text">
                            {top3Coins[0].name}
                          </h3>
                          <span className="font-mono text-xs font-bold text-[#ffd700]">
                            ${top3Coins[0].ticker}
                          </span>
                        </div>
                      </div>
                      <TierBadge level={top3Coins[0].burnLevel} />
                    </div>

                    <div className="p-4 rounded-xl bg-bg-raised/90 border border-[#ffd700]/20 font-mono text-xs space-y-1">
                      <div className="text-[#ffd700] text-[11px] uppercase font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>Leader Burn Score</span>
                      </div>
                      <div className="text-2xl font-black text-acid">
                        {formatNumber(top3Coins[0].timeAdjustedBurn)}{" "}
                        <span className="text-xs">$BATON</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCoin(top3Coins[0])}
                    className="mt-4 w-full py-3 rounded-xl bg-acid text-bg font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(212,255,63,0.3)] hover:bg-acid-dim transition-all flex items-center justify-center gap-2"
                  >
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Burn $BATON for Leader 🔥</span>
                  </button>
                </div>
              )}

              {/* #3 Bronze (if exists) */}
              {top3Coins[2] && (
                <div className="order-3 rounded-2xl border border-[#cd7f32]/40 bg-bg-card p-6 flex flex-col justify-between relative shadow-[0_0_25px_rgba(205,127,50,0.1)] hover:-translate-y-1 transition-all">
                  <div className="absolute -top-3.5 left-6 px-3 py-1 rounded-full bg-[#cd7f32] text-[#0a0b0d] font-mono text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1">
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
                          <h3 className="font-archivo text-lg text-text">
                            {top3Coins[2].name}
                          </h3>
                          <span className="font-mono text-xs text-text-dim">
                            ${top3Coins[2].ticker}
                          </span>
                        </div>
                      </div>
                      <TierBadge level={top3Coins[2].burnLevel} />
                    </div>

                    <div className="p-3 rounded-xl bg-bg-raised font-mono text-xs space-y-1">
                      <div className="text-text-faint text-[10px] uppercase">
                        Burned Total
                      </div>
                      <div className="text-xl font-bold text-acid">
                        {formatNumber(top3Coins[2].timeAdjustedBurn)}{" "}
                        <span className="text-xs">$BATON</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCoin(top3Coins[2])}
                    className="mt-4 w-full py-2.5 rounded-xl bg-bg-raised border border-acid/30 text-acid font-mono text-xs font-bold hover:bg-acid hover:text-bg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>Burn &amp; Boost</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Full Leaderboard Table */}
        <section className="rounded-3xl border border-line bg-bg-card overflow-hidden shadow-xl space-y-4 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
            <div>
              <h2 className="font-archivo text-xl text-text">Full Rankings</h2>
              <p className="font-mono text-xs text-text-dim">
                Solana mascot tokens ordered by community burn volume
              </p>
            </div>

            <div className="font-mono text-xs text-acid bg-acid/10 border border-acid/20 px-3 py-1.5 rounded-xl w-max">
              Total Burned in View: {formatNumber(totalBurnedInView)} $BATON
            </div>
          </div>

          {/* Desktop & Mobile Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-text-faint uppercase text-[11px] border-b border-line/60">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Coin</th>
                  <th className="py-3 px-3">Tier</th>
                  <th className="py-3 px-3">Market Cap</th>
                  <th className="py-3 px-3 text-right">Burned $BATON</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {rankedCoins.map((coin, index) => {
                  const rank = index + 1;
                  const rankStr = rank < 10 ? `0${rank}` : `${rank}`;

                  let rankBadgeColor = "text-text-dim";
                  if (rank === 1) rankBadgeColor = "text-[#ffd700] font-black";
                  if (rank === 2) rankBadgeColor = "text-[#c0c0c0] font-black";
                  if (rank === 3) rankBadgeColor = "text-[#cd7f32] font-black";

                  return (
                    <tr
                      key={coin.id}
                      className="hover:bg-bg-raised/50 transition-colors group"
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
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-archivo text-xs font-bold shrink-0"
                            style={{
                              backgroundColor: `${coin.iconColor}20`,
                              color: coin.iconColor,
                              border: `1px solid ${coin.iconColor}40`,
                            }}
                          >
                            {coin.ticker.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-archivo text-sm text-text group-hover:text-acid transition-colors">
                              {coin.name}
                            </div>
                            <div className="text-[11px] text-text-dim">
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
                      <td className="py-4 px-3 font-semibold text-text">
                        {formatCurrency(coin.marketCap)}
                      </td>

                      {/* Total Burned */}
                      <td className="py-4 px-3 text-right">
                        <div className="text-base font-black text-acid font-mono-num">
                          {formatNumber(coin.timeAdjustedBurn)}
                        </div>
                        <div className="text-[10px] text-text-faint uppercase">
                          $BATON
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCoin(coin)}
                          className="px-3.5 py-1.5 rounded-lg bg-bg-raised border border-acid/30 text-acid hover:bg-acid hover:text-bg font-bold text-xs transition-all shadow-[0_0_10px_rgba(212,255,63,0.1)] active:scale-95 inline-flex items-center gap-1"
                        >
                          <Flame className="w-3 h-3 fill-current" />
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

        {/* 5. Personal Scorecard Panel */}
        <section className="rounded-3xl border border-line bg-gradient-to-r from-bg-card via-bg-raised to-bg-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-acid/10 border border-acid/30 text-acid flex items-center justify-center shadow-[0_0_20px_rgba(212,255,63,0.15)]">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-archivo text-xl text-text">
                  Personal Burn Scorecard
                </h3>
                <p className="font-mono text-xs text-text-dim">
                  Your connected wallet&apos;s total contributions to the Solana mascot ecosystem
                </p>
              </div>
            </div>

            {connected && publicKey && (
              <div className="font-mono text-xs text-acid bg-acid/10 border border-acid/20 px-3 py-1.5 rounded-xl w-max">
                Connected: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </div>
            )}
          </div>

          {connected ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-2xl border border-line bg-bg-card space-y-1">
                <span className="text-[11px] text-text-faint uppercase">
                  Available $BATON Balance
                </span>
                <div className="text-xl font-bold text-text">
                  {(batonBalance ?? 0).toLocaleString()} <span className="text-xs text-acid">$BATON</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-line bg-bg-card space-y-1">
                <span className="text-[11px] text-text-faint uppercase">
                  Total Burn Contribution
                </span>
                <div className="text-xl font-bold text-acid">
                  75,000 <span className="text-xs text-text-dim">$BATON</span>
                </div>
                <span className="text-[10px] text-text-dim">★ 3 Projects Supported</span>
              </div>

              <div className="p-4 rounded-2xl border border-line bg-bg-card space-y-1">
                <span className="text-[11px] text-text-faint uppercase">
                  Community Badge
                </span>
                <div className="text-xl font-bold text-[#ffd700] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Gold Supporter</span>
                </div>
                <span className="text-[10px] text-text-dim">Top 5% Burn Leader</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-line text-center space-y-3 font-mono">
              <p className="text-xs text-text-dim max-w-md mx-auto">
                Connect your Solana wallet to view your personal burn scorecard and rank contributions.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-acid text-bg font-mono text-xs font-bold uppercase tracking-wider hover:bg-acid-dim shadow-[0_0_15px_rgba(212,255,63,0.3)] transition-all"
                >
                  Connect Wallet
                </button>
              </div>
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
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-bg-raised py-8 mt-16 text-xs text-text-faint font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-acid" />
            <span>$BATON Launchpad • Community Burn Leaderboard</span>
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
            <Link href="/" className="text-text-dim hover:text-acid transition-colors">
              ← Return to Directory
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
