"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  Trophy,
  TrendingUp,
  ExternalLink,
  Flame,
  Search,
  Sparkles,
  ArrowUpRight,
  User,
  Zap,
  Check,
  Copy,
  Clock,
  ThumbsUp,
  Eye,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CalloutLeaderboardProps {
  onSelectCaller?: (callerName: string, walletAddress?: string) => void;
  onSelectToken?: (mint: string, symbol?: string) => void;
}

export function CalloutLeaderboard({
  onSelectCaller,
  onSelectToken,
}: CalloutLeaderboardProps) {
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [copiedCA, setCopiedCA] = useState<string | null>(null);

  // Instant local cache for 0ms render
  const [cachedEntries, setCachedEntries] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`baton_cached_pnl_leaderboard_v2_${period}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const { data, isLoading } = useSWR(
    `/api/leaderboard/pnl?period=${period}`,
    fetcher,
    {
      refreshInterval: 3_000,
      revalidateOnFocus: true,
      dedupingInterval: 1_500,
    }
  );

  useEffect(() => {
    if (data?.entries && data.entries.length > 0) {
      try {
        localStorage.setItem(
          `baton_cached_pnl_leaderboard_v2_${period}`,
          JSON.stringify(data.entries)
        );
      } catch {}
    }
  }, [data?.entries, period]);

  const entries: any[] =
    data?.entries && data.entries.length > 0 ? data.entries : cachedEntries;

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCA(text);
    setTimeout(() => setCopiedCA(null), 2000);
  };

  return (
    <div className="w-full space-y-4 font-mono select-none">
      {/* ── Header Toolbar: Period Selector & Live Tag ───────────────────── */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-zinc-950 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Trophy className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                Alpha Caller Leaderboard
              </h2>
              <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                LIVE PNL
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Highest profit Solana traders & callouts ranked in real-time.
            </p>
          </div>
        </div>

        {/* 24h / 7d Period Switcher */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-white/5 text-xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPeriod("daily")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              period === "daily"
                ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>24H Leaderboard</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              period === "weekly"
                ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>7D Leaderboard</span>
          </button>
        </div>
      </div>

      {/* ── Leaderboard Cards List ───────────────────────────────────────── */}
      <div className="space-y-3">
        {entries.map((trader: any) => {
          const rank = trader.rank;
          const isTop3 = rank <= 3;
          const rankBadgeBg =
            rank === 1
              ? "bg-gradient-to-r from-amber-400 to-amber-600 text-zinc-950 ring-amber-400/50 shadow-amber-500/30"
              : rank === 2
              ? "bg-gradient-to-r from-slate-300 to-zinc-400 text-zinc-950 ring-slate-400/50 shadow-slate-500/20"
              : rank === 3
              ? "bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 ring-amber-700/50 shadow-amber-800/20"
              : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5";

          const pnlPositive = trader.pnlUsd >= 0;
          const callout = trader.callout;

          return (
            <div
              key={`${trader.walletAddress}-${rank}`}
              className={`p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-950 border transition-all duration-200 hover:border-amber-500/40 shadow-sm ${
                isTop3
                  ? "border-amber-500/30 dark:border-amber-500/25 bg-gradient-to-r from-amber-500/[0.02] to-transparent"
                  : "border-zinc-200 dark:border-white/10"
              }`}
            >
              {/* ── Top Header Row: Rank + Trader Profile + Quick Action Button ── */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-sm ring-1 ${rankBadgeBg}`}
                  >
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                  </div>

                  {/* Trader Avatar */}
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shrink-0 shadow-sm">
                    {trader.profileImage ? (
                      <img
                        src={trader.profileImage}
                        alt={trader.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-500/10 text-amber-500 font-bold text-xs">
                        {trader.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Username & Wallet */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectCaller?.(trader.username, trader.walletAddress)}
                        className="text-xs sm:text-sm font-black text-zinc-950 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer truncate max-w-[120px] sm:max-w-[200px] text-left block"
                        title={`Click to view all callouts from @${trader.username}`}
                      >
                        @{trader.username}
                      </button>
                      <a
                        href={`https://pump.fun/profile/${trader.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-0.5 text-zinc-400 hover:text-amber-400 transition-colors"
                        title="View on Pump.fun"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                      <span>{`${trader.walletAddress.slice(0, 4)}…${trader.walletAddress.slice(-4)}`}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(trader.walletAddress, e)}
                        className="hover:text-amber-400 transition-colors"
                        title="Copy Wallet Address"
                      >
                        {copiedCA === trader.walletAddress ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary CTA: View Calls Button (Thumb-reachable on mobile) */}
                <button
                  type="button"
                  onClick={() => onSelectCaller?.(trader.username, trader.walletAddress)}
                  className="py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-black text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm shrink-0"
                  title={`View signals called by @${trader.username}`}
                >
                  <span>View Calls</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* ── Middle Metrics Row: Clean Responsive Columns ─────────────── */}
              <div className="mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-3 text-xs">
                {/* Net PnL */}
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Net PnL ({period === "weekly" ? "7D" : "24H"})
                  </span>
                  <span
                    className={`text-sm sm:text-base font-black font-mono flex items-center gap-1 ${
                      pnlPositive
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {pnlPositive ? `+$${formatNumber(trader.pnlUsd)}` : `-$${formatNumber(Math.abs(trader.pnlUsd))}`}
                  </span>
                  {trader.pnlSol !== undefined && trader.pnlSol !== 0 && (
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      ≈ {trader.pnlSol > 0 ? `+${trader.pnlSol.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : trader.pnlSol.toLocaleString(undefined, { maximumFractionDigits: 1 })} SOL
                    </span>
                  )}
                </div>

                {/* Return ROI Badge */}
                <div className="text-right sm:text-center shrink-0">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">
                    ROI / Gain
                  </span>
                  <span
                    className={`inline-block text-xs sm:text-sm font-black font-mono px-2 py-0.5 rounded-lg border mt-0.5 ${
                      trader.pnlPercentage >= 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {trader.pnlPercentage >= 0
                      ? `+${trader.pnlPercentage.toFixed(1)}%`
                      : `${trader.pnlPercentage.toFixed(1)}%`}
                  </span>
                </div>

                {/* Position Value (Desktop/Tablet) */}
                <div className="hidden sm:block text-right shrink-0">
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Position Value
                  </span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 font-mono">
                    ${formatNumber(trader.valueUsd)}
                  </span>
                </div>
              </div>

              {/* ── Bottom Winning Coin Strip ─────────────────────────────────── */}
              {(trader.coinSymbol || callout) && (
                <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 shrink-0 uppercase tracking-wider">
                      🏆 WINNING COIN
                    </span>
                    {trader.coinSymbol ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        {trader.coinIconUrl && (
                          <img src={trader.coinIconUrl} alt={trader.coinSymbol} className="w-4 h-4 rounded-full object-cover shrink-0" />
                        )}
                        <span className="font-black text-xs text-zinc-900 dark:text-white font-mono">
                          ${trader.coinSymbol}
                        </span>
                        {trader.coinName && trader.coinName !== trader.coinSymbol && (
                          <span className="text-[10px] text-zinc-400 truncate max-w-[100px] sm:max-w-[140px]">
                            ({trader.coinName})
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-zinc-600 dark:text-zinc-300 italic truncate text-[11px]">
                        &ldquo;{callout?.thesis || "High conviction alpha breakout."}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    {trader.coinMint && (
                      <button
                        type="button"
                        onClick={() => onSelectToken?.(trader.coinMint, trader.coinSymbol || "TOKEN")}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 dark:text-amber-400 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      >
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>Trade ${trader.coinSymbol || "Coin"}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalloutLeaderboard;
