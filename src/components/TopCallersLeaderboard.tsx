"use client";

import React, { useState } from "react";
import {
  Trophy,
  Award,
  TrendingUp,
  ExternalLink,
  Flame,
  Zap,
  Copy,
  Check,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface CallerLeaderboardItem {
  rank: number;
  wallet: string;
  username?: string;
  totalCalls: number;
  winRate: number;
  avgRoi: number;
  totalMcapCalled: number;
  rewardTier: "Diamond" | "Gold" | "Silver";
  estimatedRewardBaton: number;
  recentTokens: string[];
}

interface TopCallersLeaderboardProps {
  callers: CallerLeaderboardItem[];
  onSelectCaller?: (wallet: string) => void;
  selectedCaller?: string | null;
  onClearFilter?: () => void;
}

export const TopCallersLeaderboard: React.FC<TopCallersLeaderboardProps> = ({
  callers,
  onSelectCaller,
  selectedCaller,
  onClearFilter,
}) => {
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const handleCopy = (wallet: string) => {
    navigator.clipboard.writeText(wallet);
    setCopiedWallet(wallet);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  const top3 = callers.slice(0, 3);

  const getTierBadge = (tier: "Diamond" | "Gold" | "Silver") => {
    switch (tier) {
      case "Diamond":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-500 dark:text-cyan-300 font-mono text-[11px] font-bold uppercase shadow-sm">
            <span>💎 Diamond Tier (10x)</span>
          </span>
        );
      case "Gold":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/40 text-amber-600 dark:text-amber-300 font-mono text-[11px] font-bold uppercase shadow-sm">
            <span>🥇 Gold Tier (5x)</span>
          </span>
        );
      case "Silver":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-bold uppercase shadow-sm">
            <span>🥈 Silver Tier (2x)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Info Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/20 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
              <span>Pump.fun Alpha Caller Rewards Program</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-lime-400/15 border border-lime-400/30 text-lime-600 dark:text-lime-400 font-bold uppercase">
                Epoch #4 Active
              </span>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs mt-0.5">
              Verified callers earn direct $BATON yield multipliers &amp; bounty pools based on verified accuracy, win rate, and community outbids.
            </p>
          </div>
        </div>

        {selectedCaller && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-orange-500 font-bold">
              Filtered by: {selectedCaller.slice(0, 4)}...{selectedCaller.slice(-4)}
            </span>
            <button
              type="button"
              onClick={onClearFilter}
              className="px-3 py-1 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
            >
              Show All
            </button>
          </div>
        )}
      </div>

      {/* 2. Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((caller) => {
            const isRank1 = caller.rank === 1;
            const isRank2 = caller.rank === 2;
            const isRank3 = caller.rank === 3;

            return (
              <div
                key={`podium-${caller.rank}`}
                className={`relative rounded-2xl border p-5 space-y-4 shadow-lg transition-all ${
                  isRank1
                    ? "bg-gradient-to-b from-amber-500/15 via-white dark:via-[#15171C] to-white dark:to-[#111318] border-amber-500/40 dark:border-amber-500/30 ring-1 ring-amber-500/20"
                    : isRank2
                    ? "bg-white dark:bg-[#15171C] border-zinc-300 dark:border-zinc-700"
                    : "bg-white dark:bg-[#15171C] border-amber-700/30 dark:border-amber-700/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-mono text-sm font-black shadow-sm ${
                        isRank1
                          ? "bg-amber-500 text-black shadow-amber-500/30"
                          : isRank2
                          ? "bg-zinc-300 dark:bg-zinc-700 text-black dark:text-white"
                          : "bg-amber-700 text-white"
                      }`}
                    >
                      #{caller.rank}
                    </span>

                    <div>
                      <div className="font-archivo text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>{caller.username || `Caller ${caller.wallet.slice(0, 4)}...${caller.wallet.slice(-4)}`}</span>
                        {isRank1 && <Star className="w-4 h-4 text-amber-500 fill-current" />}
                      </div>
                      <div className="font-mono text-xs text-zinc-400 flex items-center gap-1">
                        <span>{caller.wallet.slice(0, 4)}...{caller.wallet.slice(-4)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(caller.wallet)}
                          className="hover:text-orange-500"
                          title="Copy Wallet Address"
                        >
                          {copiedWallet === caller.wallet ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {getTierBadge(caller.rewardTier)}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-[#1c1f26] border border-zinc-200/60 dark:border-white/5 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Win Rate</div>
                    <div className="font-black text-emerald-500 text-sm font-mono-num">
                      {caller.winRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Avg. ROI</div>
                    <div className="font-black text-orange-500 text-sm font-mono-num">
                      +{caller.avgRoi}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Total Calls</div>
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">
                      {caller.totalCalls} Calls
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">Volume Called</div>
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 font-mono-num truncate">
                      {formatCurrency(caller.totalMcapCalled)}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => onSelectCaller?.(caller.wallet)}
                  className="w-full py-2 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white dark:text-orange-400 dark:hover:text-white border border-orange-500/30 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>View All Calls ({caller.totalCalls})</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Full Leaderboard Table */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-500" />
            <h3 className="font-archivo text-base font-bold text-zinc-900 dark:text-white">
              Full Caller Rankings &amp; Reward Multipliers
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400 font-bold">
            {callers.length} Verified Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-zinc-50 dark:bg-[#111318] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-200 dark:border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-bold">Rank</th>
                <th className="py-3.5 px-4 font-bold">Caller Identity</th>
                <th className="py-3.5 px-4 font-bold">Total Calls</th>
                <th className="py-3.5 px-4 font-bold">Avg. ROI</th>
                <th className="py-3.5 px-4 font-bold">Win Rate</th>
                <th className="py-3.5 px-4 font-bold">Reward Tier</th>
                <th className="py-3.5 px-4 font-bold">Est. Reward Pool</th>
                <th className="py-3.5 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {callers.map((caller) => {
                const isSelected = selectedCaller === caller.wallet;
                return (
                  <tr
                    key={caller.rank}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-orange-500/10 dark:bg-orange-500/20"
                        : "hover:bg-zinc-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-4 font-bold text-zinc-900 dark:text-white">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                          caller.rank === 1
                            ? "bg-amber-500/20 text-amber-500"
                            : caller.rank === 2
                            ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                            : caller.rank === 3
                            ? "bg-amber-700/20 text-amber-700"
                            : "text-zinc-400 font-mono"
                        }`}
                      >
                        #{caller.rank}
                      </span>
                    </td>

                    {/* Caller Identity */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-bold text-orange-500 text-xs shrink-0">
                          {caller.username ? caller.username.slice(0, 2).toUpperCase() : `C${caller.rank}`}
                        </div>
                        <div>
                          <div className="font-archivo text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                            {caller.username || `Caller ${caller.wallet.slice(0, 4)}...${caller.wallet.slice(-4)}`}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-400 flex items-center gap-1">
                            <span>{caller.wallet.slice(0, 4)}...{caller.wallet.slice(-4)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(caller.wallet)}
                              className="hover:text-orange-500"
                              title="Copy Wallet Address"
                            >
                              {copiedWallet === caller.wallet ? (
                                <Check className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total Calls */}
                    <td className="py-4 px-4 text-zinc-700 dark:text-zinc-300 font-mono-num">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{caller.totalCalls} calls</span>
                      </div>
                    </td>

                    {/* Avg ROI */}
                    <td className="py-4 px-4 font-black text-orange-500 font-mono-num">
                      +{caller.avgRoi}%
                    </td>

                    {/* Win Rate */}
                    <td className="py-4 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono-num">
                      {caller.winRate}%
                    </td>

                    {/* Reward Tier */}
                    <td className="py-4 px-4">
                      {getTierBadge(caller.rewardTier)}
                    </td>

                    {/* Estimated Reward */}
                    <td className="py-4 px-4 font-black text-zinc-900 dark:text-white font-mono-num">
                      {formatNumber(caller.estimatedRewardBaton)} $BATON
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectCaller?.(caller.wallet)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all shadow-sm"
                      >
                        View Calls →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
