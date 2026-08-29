"use client";

/**
 * TrackedLeaderboard
 *
 * Derives a leaderboard from /api/callouts data — no separate endpoint.
 * This ranks ONLY wallets in our watchlist. It is NOT the official
 * Pump.fun Callout Rewards ranking, and USDC/dollar payouts are not shown.
 *
 * Score formula (pure engagement signal, no financial claim):
 *   score = Σ maxMultiplier × 10 + Σ likes + Σ viewCount / 100 + callCount × 2
 */

import React, { useMemo } from "react";
import { CalloutsApiResponse, CalloutCard } from "@/lib/types/callouts";
import { Copy, Check, TrendingUp, Heart, Clock, Info } from "lucide-react";

// ── Score function ────────────────────────────────────────────────────────────

function computeScore(cards: CalloutCard[]): number {
  let score = 0;
  for (const c of cards) {
    score += (c.maxMultiplier ?? 0) * 10;
    score += c.likes ?? 0;
    score += (c.viewCount ?? 0) / 100;
    score += 2; // +2 per call
  }
  return score;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeaderboardRow {
  wallet: string;
  label: string;
  callCount: number;
  bestMaxMultiplier: number; // highest maxMultiplier across calls
  totalLikes: number;
  totalViews: number;
  lastCallAt: number; // ms; 0 if no calls
  score: number;
  isWatching: boolean; // true = in list but callCount === 0
}

// ── Derivation ────────────────────────────────────────────────────────────────

function deriveLeaderboard(
  data: CalloutsApiResponse | undefined
): LeaderboardRow[] {
  if (!data) return [];

  // Build a map wallet → calls
  const byWallet = new Map<string, CalloutCard[]>();
  for (const card of data.callouts) {
    const list = byWallet.get(card.callerWallet) ?? [];
    list.push(card);
    byWallet.set(card.callerWallet, list);
  }

  // Merge with watched list (so wallets with 0 calls still appear)
  const rows: LeaderboardRow[] = data.watched.map(({ wallet, label }) => {
    const cards = byWallet.get(wallet) ?? [];
    const callCount = cards.length;

    const bestMaxMultiplier =
      callCount > 0 ? Math.max(...cards.map((c) => c.maxMultiplier ?? 0)) : 0;

    const totalLikes = cards.reduce((s, c) => s + (c.likes ?? 0), 0);
    const totalViews = cards.reduce((s, c) => s + (c.viewCount ?? 0), 0);
    const lastCallAt =
      callCount > 0 ? Math.max(...cards.map((c) => c.createdAt ?? 0)) : 0;

    const score = computeScore(cards);

    return {
      wallet,
      label,
      callCount,
      bestMaxMultiplier,
      totalLikes,
      totalViews,
      lastCallAt,
      score,
      isWatching: callCount === 0,
    };
  });

  // Sort: active callers by score DESC, then watchers (callCount === 0) at the bottom
  rows.sort((a, b) => {
    if (a.isWatching !== b.isWatching) return a.isWatching ? 1 : -1;
    return b.score - a.score;
  });

  return rows;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(ms: number): string {
  if (!ms) return "—";
  const s = Math.max(0, Date.now() - ms) / 1000;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtX(x: number): string {
  if (!x || x <= 0) return "—";
  return `${x.toFixed(2)}x`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TrackedLeaderboardProps {
  data: CalloutsApiResponse | undefined;
  isLoading?: boolean;
  /** callback from parent — share the same copied state */
  copied: string | null;
  onCopy: (text: string) => void;
  /** Selected caller for filtering */
  selectedCaller?: string | null;
  onSelectCaller?: (caller: string) => void;
}

export const TrackedLeaderboard: React.FC<TrackedLeaderboardProps> = ({
  data,
  isLoading,
  copied,
  onCopy,
  selectedCaller,
  onSelectCaller,
}) => {
  const rows = useMemo(() => deriveLeaderboard(data), [data]);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-white font-mono tracking-wide">
          Tracked callers <span className="text-zinc-500">(watchlist)</span>
        </h2>
        <p className="text-[11px] text-zinc-600 font-mono leading-snug">
          Ranked among wallets we follow. Not official Pump payout rank.
        </p>
      </div>

      {/* ── Disclaimer chip ── */}
      <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/40 text-[10px] font-mono text-zinc-500 leading-snug">
        <Info className="w-3 h-3 text-zinc-600 shrink-0 mt-0.5" />
        Score = Σ ATH×10 + likes + views/100 + calls×2. No USDC. Watchlist only.
      </div>

      {/* ── Table ── */}
      {isLoading && !data ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-xs text-zinc-600 font-mono py-4 text-center">
          No data yet.
        </p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row, idx) => {
            const rank = row.isWatching ? null : idx + 1;
            const isSelected =
              Boolean(selectedCaller) &&
              (selectedCaller?.toLowerCase() === row.label.toLowerCase() ||
                selectedCaller === row.wallet);

            return (
              <div
                key={row.wallet}
                onClick={() => onSelectCaller?.(row.label)}
                className={`px-3 py-2.5 rounded-xl border flex items-center gap-3 text-[11px] font-mono transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-orange-500/20 border-orange-500 text-orange-200 ring-1 ring-orange-500/50 shadow-sm"
                    : row.isWatching
                    ? "bg-zinc-900/30 border-zinc-800/40 opacity-70 hover:opacity-100 hover:border-zinc-700"
                    : rank === 1
                    ? "bg-amber-500/8 border-amber-500/25 hover:border-amber-500/50"
                    : "bg-zinc-900/60 border-zinc-800/60 hover:border-zinc-700"
                }`}
              >
                {/* Rank */}
                <div className="w-6 shrink-0 text-center">
                  {row.isWatching ? (
                    <span className="text-zinc-600 text-[9px] uppercase tracking-wide">
                      watch
                    </span>
                  ) : (
                    <span
                      className={`font-black ${
                        isSelected
                          ? "text-orange-400"
                          : rank === 1
                          ? "text-amber-400"
                          : rank === 2
                          ? "text-zinc-300"
                          : rank === 3
                          ? "text-orange-600"
                          : "text-zinc-600"
                      }`}
                    >
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Avatar initials */}
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold uppercase shrink-0 ${
                    isSelected
                      ? "bg-orange-500/30 border-orange-400 text-orange-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  }`}
                >
                  {row.label.slice(0, 2)}
                </div>

                {/* Label + wallet short */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold truncate ${
                        isSelected ? "text-orange-300" : "text-zinc-100"
                      }`}
                    >
                      {row.label}
                    </span>
                    {rank === 1 && !row.isWatching && (
                      <span className="text-amber-400 text-[10px]">👑</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-600 mt-0.5">
                    <span>
                      {row.wallet.slice(0, 4)}…{row.wallet.slice(-4)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(row.wallet);
                      }}
                      className="hover:text-zinc-300 transition-colors p-0.5"
                      title="Copy wallet"
                    >
                      {copied === row.wallet ? (
                        <Check className="w-2.5 h-2.5 text-lime-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Stats (compact) */}
                <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                  {/* callCount + best ATH */}
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">
                      <span className="font-bold text-zinc-200">
                        {row.callCount}
                      </span>{" "}
                      calls
                    </span>
                    {row.bestMaxMultiplier > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                        <TrendingUp className="w-2.5 h-2.5" />
                        {fmtX(row.bestMaxMultiplier)} ATH
                      </span>
                    )}
                  </div>

                  {/* likes + last call */}
                  <div className="flex items-center gap-2 text-zinc-600">
                    {row.totalLikes > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5" />
                        {row.totalLikes}
                      </span>
                    )}
                    {row.lastCallAt > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(row.lastCallAt)}
                      </span>
                    )}
                    {row.isWatching && (
                      <span className="text-zinc-700 italic">
                        no callouts yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
