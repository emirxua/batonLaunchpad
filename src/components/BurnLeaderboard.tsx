"use client";

import React, { useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardItem } from "@/types/token";
import { formatNumber } from "@/lib/utils";
import { BoostAnyTokenModal } from "@/components/modals/BoostAnyTokenModal";
import {
  Flame,
  Crown,
  Medal,
  ExternalLink,
  Copy,
  Check,
  Zap,
  RefreshCw,
  PlusCircle,
  Clock,
  Sparkles,
} from "lucide-react";

interface BurnLeaderboardProps {
  onBoostToken?: (item: LeaderboardItem) => void;
}

export function BurnLeaderboard({ onBoostToken }: BurnLeaderboardProps) {
  const { leaderboard, isLoading, refresh } = useLeaderboard();
  const [copiedCA, setCopiedCA] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBoostAnyOpen, setIsBoostAnyOpen] = useState(false);

  const handleCopy = (ca: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ca);
    setCopiedCA(ca);
    setTimeout(() => setCopiedCA(null), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const totalBurnedAll = leaderboard.reduce(
    (acc, curr) => acc + curr.totalBatonBurned,
    0
  );

  return (
    <div className="w-full space-y-4 font-mono select-none">
      {/* ── Main Burn-to-Rank Table Card ─────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-2xl">
        {/* Table Header Row */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-orange-500 fill-current" />
            <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
              Ranked Projects
            </h2>
            <span className="text-[10px] text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded font-bold">
              {leaderboard.length} Projects
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-zinc-500">
              Total Burned:{" "}
              <span className="text-amber-400 font-extrabold">
                {formatNumber(totalBurnedAll)} $BATON
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsBoostAnyOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 transition-all uppercase tracking-wider cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Boost Token</span>
            </button>
          </div>
        </div>

        {/* Table List / Empty State */}
        {leaderboard.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-4 font-mono">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Crown className="w-7 h-7 animate-pulse text-amber-400" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white uppercase tracking-wider">
                No Projects Ranked Yet
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Standings are empty because no tokens have been boosted with $BATON burns yet. Enter any Solana Contract Address (CA) and burn $BATON to take the #1 Crown!
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsBoostAnyOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 mx-auto cursor-pointer active:scale-95"
              >
                <Flame className="w-4 h-4 fill-current text-zinc-950" />
                <span>🔥 Boost Any Token (Search CA &amp; Burn $BATON)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-500 text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Rank</th>
                  <th className="py-3.5 px-4 font-bold">Project</th>
                  <th className="py-3.5 px-4 font-bold">Contract Address</th>
                  <th className="py-3.5 px-4 font-bold text-right">Market Cap</th>
                  <th className="py-3.5 px-4 font-bold text-right">Burned $BATON</th>
                  <th className="py-3.5 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                {leaderboard.map((item: LeaderboardItem) => {
                  const isGold = item.rank === 1;
                  const isSilver = item.rank === 2;
                  const isBronze = item.rank === 3;

                  return (
                    <tr
                      key={item.ca}
                      onClick={() => {
                        if (onBoostToken) onBoostToken(item);
                      }}
                      className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* Rank Badge */}
                      <td className="py-3.5 px-4 font-bold text-sm">
                        {isGold ? (
                          <span className="text-amber-400 flex items-center gap-1 font-black">
                            <Crown className="w-4 h-4 fill-current text-amber-400" />
                            #1
                          </span>
                        ) : isSilver ? (
                          <span className="text-zinc-300 flex items-center gap-1 font-bold">
                            <Medal className="w-4 h-4 text-zinc-400" />
                            #2
                          </span>
                        ) : isBronze ? (
                          <span className="text-orange-400 flex items-center gap-1 font-bold">
                            <Medal className="w-4 h-4 text-orange-500" />
                            #3
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-bold">#{item.rank}</span>
                        )}
                      </td>

                      {/* Project & Symbol */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-amber-400">
                            {item.iconUrl ? (
                              <img
                                src={item.iconUrl}
                                alt={item.symbol}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>${item.symbol.slice(0, 3)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-950 dark:text-white group-hover:text-amber-400 transition-colors">
                              {item.projectName}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              ${item.symbol}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CA */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                            {item.ca.slice(0, 4)}…{item.ca.slice(-4)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(item.ca, e)}
                            className="hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
                            title="Copy CA"
                          >
                            {copiedCA === item.ca ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={`https://solscan.io/token/${item.ca}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-amber-400 transition-colors p-0.5"
                            title="View on Solscan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Market Cap */}
                      <td className="py-3.5 px-4 text-right font-medium text-zinc-800 dark:text-zinc-200">
                        {item.mcapFormatted}
                      </td>

                      {/* Total Burned */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-extrabold text-amber-400 flex items-center justify-end gap-1">
                          <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
                          {formatNumber(item.totalBatonBurned)} $BATON
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onBoostToken) onBoostToken(item);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-[11px] transition-all uppercase tracking-wider cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-1 mx-auto"
                        >
                          <Flame className="w-3 h-3 fill-current" />
                          <span>Boost This Token</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Boost Any Token Modal ────────────────────────────────────── */}
      <BoostAnyTokenModal
        isOpen={isBoostAnyOpen}
        onClose={() => setIsBoostAnyOpen(false)}
        onSuccess={() => {
          setIsBoostAnyOpen(false);
          refresh();
        }}
      />
    </div>
  );
}

export default BurnLeaderboard;
