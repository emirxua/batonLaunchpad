"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Coin } from "@/types/coin";
import { formatCurrency } from "@/lib/utils";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import {
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Flame,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface RankedAttentionTableProps {
  // If provided, use this data (parent-controlled mode)
  // If not provided, the table fetches its own live data
  coins?: Coin[];
  isLoading?: boolean;
  onOutbidClick?: (coin: Coin) => void;
}

const CATEGORIES = [
  { id: "all", label: "ALL" },
  { id: "Mascots", label: "MASCOTS" },
  { id: "Agents", label: "AI AGENTS" },
  { id: "Memes", label: "MEMES" },
  { id: "Utility", label: "UTILITY" },
  { id: "DeFi", label: "DEFI" },
];


export function RankedAttentionTable({
  coins: propCoins,
  isLoading: propLoading,
  onOutbidClick,
}: RankedAttentionTableProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"mcap" | "volume" | "liquidity">("mcap");
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  // Self-fetch when parent doesn't supply coins
  const {
    rankedCoins: liveRanked,
    isLoading: liveLoading,
    isValidating,
    updatedAt,
    refresh,
  } = useLeaderboard();

  const sourceCoins = propCoins !== undefined ? propCoins : liveRanked;
  const loading = propCoins !== undefined ? (propLoading ?? false) : liveLoading;

  const handleCopy = (mint: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const filteredCoins = useMemo(() => {
    let list = [...sourceCoins];
    if (selectedCategory !== "all") {
      list = list.filter(
        (c) => c.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "volume") {
      list.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
    } else if (sortBy === "liquidity") {
      list.sort((a, b) => (b.liquidityUsd || b.marketCap || 0) - (a.liquidityUsd || a.marketCap || 0));
    } else {
      // Default: attention / market cap
      list.sort((a, b) => {
        if (a.ticker === "BATON") return -1;
        if (b.ticker === "BATON") return 1;
        return (b.marketCap || 0) - (a.marketCap || 0);
      });
    }

    return list;
  }, [sourceCoins, selectedCategory, sortBy]);

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col font-mono">
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            RANKED ATTENTION LADDER
          </span>
          <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-100 dark:border-white/5">
            {filteredCoins.length} TRACKED
          </span>
          {updatedAt && !propCoins && (
            <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline">
              · {new Date(updatedAt).toLocaleTimeString()}
            </span>
          )}
          {isValidating && !propCoins && (
            <RefreshCw className="w-3 h-3 text-zinc-600 animate-spin" />
          )}
        </div>

        {/* Category Tabs & Sort Filter */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                {cat.label}
              </button>
            );
          })}

          <div className="h-3.5 w-px bg-zinc-300 dark:bg-zinc-800 mx-1 hidden sm:block" />

          {/* Sort selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSortBy(sortBy === "volume" ? "mcap" : "volume")}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                sortBy === "volume"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Sort by 24h Volume"
            >
              VOL
            </button>
            <button
              type="button"
              onClick={() => setSortBy(sortBy === "liquidity" ? "mcap" : "liquidity")}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                sortBy === "liquidity"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Sort by Liquidity"
            >
              LIQ
            </button>
          </div>

          {!propCoins && (
            <button
              type="button"
              onClick={() => refresh()}
              title="Refresh Leaderboard"
              className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-white/5 border border-transparent transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-950/80 text-zinc-500 text-[10px] uppercase tracking-wider select-none">
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Token</th>
              <th className="py-2.5 px-4 text-right">Market Cap</th>
              <th className="py-2.5 px-4 text-right">24h</th>
              <th className="py-2.5 px-4 text-right">Category</th>
              <th className="py-2.5 px-4 text-center w-28">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {loading && filteredCoins.length === 0 ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4 text-center">
                    <div className="h-3 w-4 bg-zinc-800 rounded mx-auto" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-zinc-800" />
                      <div className="space-y-1">
                        <div className="h-2.5 w-20 bg-zinc-800 rounded" />
                        <div className="h-2 w-14 bg-zinc-800/60 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right"><div className="h-3 w-16 bg-zinc-800 rounded ml-auto" /></td>
                  <td className="py-3 px-4 text-right"><div className="h-3 w-12 bg-zinc-800 rounded ml-auto" /></td>
                  <td className="py-3 px-4 text-right"><div className="h-3 w-14 bg-zinc-800 rounded ml-auto" /></td>
                  <td className="py-3 px-4 text-center"><div className="h-6 w-16 bg-zinc-800 rounded mx-auto" /></td>
                </tr>
              ))
            ) : filteredCoins.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono text-xs">
                  <div className="flex flex-col items-center gap-2">
                    <Flame className="w-5 h-5 text-zinc-700" />
                    <span>No tokens in {selectedCategory.toUpperCase()} yet.</span>
                    {selectedCategory !== "all" && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("all")}
                        className="text-amber-400 hover:text-amber-300 text-[11px] font-bold cursor-pointer"
                      >
                        → Show All
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredCoins.map((token, idx) => {
                const rankNumber = idx + 2;
                const isPositive = (token.change24h || 0) >= 0;
                const shortMint = `${token.mintAddress.slice(0, 4)}…${token.mintAddress.slice(-4)}`;

                return (
                  <tr
                    key={token.id || token.mintAddress}
                    className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                    onClick={() => onOutbidClick?.(token)}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center text-zinc-500 font-bold group-hover:text-amber-400 transition-colors">
                      #{rankNumber}
                    </td>

                    {/* Token Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-200 dark:border-white/10 shrink-0 flex items-center justify-center">
                          {token.imageUrl ? (
                            <Image
                              src={token.imageUrl}
                              alt={token.name}
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400">
                              {token.ticker.slice(0, 2)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-950 dark:text-white text-xs truncate">
                              ${token.ticker}
                            </span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[100px]">
                              {token.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <span>{shortMint}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(token.mintAddress, e)}
                              className="hover:text-amber-400 transition-colors p-0.5"
                              title="Copy CA"
                            >
                              {copiedMint === token.mintAddress ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                            <a
                              href={`https://dexscreener.com/solana/${token.mintAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-zinc-300 transition-colors p-0.5"
                              title="DexScreener"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-4 text-right text-zinc-700 dark:text-zinc-300 font-medium">
                      {token.marketCap && token.marketCap > 0 ? formatCurrency(token.marketCap) : "—"}
                    </td>

                    {/* 24h Change */}
                    <td className="py-3 px-4 text-right">
                      <div className={`inline-flex items-center gap-0.5 font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>
                          {isPositive ? "+" : ""}{(token.change24h || 0).toFixed(2)}%
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        {token.category || "—"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOutbidClick?.(token);
                        }}
                        className="px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 hover:text-amber-300 font-bold text-[11px] tracking-wider uppercase transition-all shadow-sm cursor-pointer"
                      >
                        [ OUTBID ]
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RankedAttentionTable;

