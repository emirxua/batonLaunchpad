"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Coin } from "@/types/coin";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import {
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Flame,
  ExternalLink,
  RefreshCw,
  Droplets,
  BarChart2,
  ArrowRightLeft,
} from "lucide-react";

interface AttentionLadderProps {
  coins?: Coin[];
  isLoading?: boolean;
  onSelectToken?: (mint: string, symbol: string) => void;
  onOutbidClick?: (coin: Coin) => void;
}

const CATEGORIES = [
  { id: "all", label: "ALL" },
  { id: "Mascots", label: "MASCOTS" },
  { id: "Agents", label: "AI AGENTS" },
  { id: "Memes", label: "MEMES" },
  { id: "Utility", label: "UTILITY" },
];

export function AttentionLadder({
  coins: propCoins,
  isLoading: propLoading,
  onSelectToken,
  onOutbidClick,
}: AttentionLadderProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"mcap" | "volume" | "liquidity">("mcap");
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

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
      list.sort((a, b) => {
        if (a.ticker === "BATON") return -1;
        if (b.ticker === "BATON") return 1;
        return (b.marketCap || 0) - (a.marketCap || 0);
      });
    }

    return list;
  }, [sourceCoins, selectedCategory, sortBy]);

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col font-mono select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            ATTENTION LADDER
          </span>
          <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-100 dark:border-white/5">
            {filteredCoins.length} PROJECTS
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
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
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

          {/* Sort Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSortBy(sortBy === "volume" ? "mcap" : "volume")}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                sortBy === "volume"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Sort by 24h Volume"
            >
              <BarChart2 className="w-2.5 h-2.5" />
              <span>VOL</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy(sortBy === "liquidity" ? "mcap" : "liquidity")}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                sortBy === "liquidity"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Sort by Liquidity"
            >
              <Droplets className="w-2.5 h-2.5" />
              <span>LIQ</span>
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
              <th className="py-2.5 px-4 text-right">24h Change</th>
              <th className="py-2.5 px-4 text-right">24h Vol / Liq</th>
              <th className="py-2.5 px-4 text-right">Category</th>
              <th className="py-2.5 px-4 text-center w-28">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {loading && filteredCoins.length === 0 ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
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
                  <td className="py-3 px-4 text-right"><div className="h-3 w-16 bg-zinc-800 rounded ml-auto" /></td>
                  <td className="py-3 px-4 text-right"><div className="h-3 w-14 bg-zinc-800 rounded ml-auto" /></td>
                  <td className="py-3 px-4 text-center"><div className="h-6 w-16 bg-zinc-800 rounded mx-auto" /></td>
                </tr>
              ))
            ) : filteredCoins.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                  <p>No active attention projects found in {selectedCategory.toUpperCase()}.</p>
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="mt-2 text-amber-400 hover:underline text-[11px] cursor-pointer"
                  >
                    View all projects →
                  </button>
                </td>
              </tr>
            ) : (
              filteredCoins.map((coin, index) => {
                const isBAton = coin.ticker === "BATON" || coin.id === "baton-primary";
                const isPositive = (coin.change24h || 0) >= 0;
                const shortMint = `${coin.mintAddress.slice(0, 4)}...${coin.mintAddress.slice(-4)}`;

                return (
                  <tr
                    key={coin.id || coin.mintAddress}
                    onClick={() => onSelectToken?.(coin.mintAddress, coin.ticker)}
                    className={`transition-colors cursor-pointer group ${
                      isBAton
                        ? "bg-amber-500/10 hover:bg-amber-500/15"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center font-bold text-zinc-500">
                      {isBAton ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black">
                          #1
                        </span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </td>

                    {/* Token Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-100 dark:border-white/10 shrink-0 flex items-center justify-center">
                          {coin.imageUrl ? (
                            <Image
                              src={coin.imageUrl}
                              alt={coin.name}
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400">
                              {coin.ticker.slice(0, 2)}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-900 dark:text-white text-xs truncate">
                              ${coin.ticker}
                            </span>
                            {isBAton && (
                              <span className="px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                                PINNED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <span>{shortMint}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(coin.mintAddress, e)}
                              className="hover:text-amber-400 transition-colors p-0.5"
                              title="Copy CA"
                            >
                              {copiedMint === coin.mintAddress ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                            <a
                              href={`https://pump.fun/coin/${coin.mintAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-emerald-400 transition-colors p-0.5 text-[10px] text-emerald-500 font-bold flex items-center gap-0.5"
                              title="Trade on Pump.fun"
                            >
                              <span>💊</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            {coin.pairAddress && (
                              <a
                                href={`https://dexscreener.com/solana/${coin.pairAddress}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-zinc-300 transition-colors p-0.5"
                                title="DexScreener"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(coin.marketCap)}
                    </td>

                    {/* 24h Change */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        <span>{isPositive ? "+" : ""}{(coin.change24h || 0).toFixed(2)}%</span>
                      </span>
                    </td>

                    {/* Volume / Liquidity */}
                    <td className="py-3 px-4 text-right text-[11px] text-zinc-400">
                      {sortBy === "liquidity"
                        ? formatCurrency(coin.liquidityUsd || 0)
                        : formatCurrency(coin.volume24h || 0)}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800/80 border border-zinc-100 dark:border-white/5 text-zinc-400 font-medium uppercase">
                        {coin.category || "General"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/terminal?outputMint=${coin.mintAddress}&outputSymbol=${coin.ticker}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-[10px] font-bold transition-all"
                      >
                        <ArrowRightLeft className="w-2.5 h-2.5" />
                        <span>SWAP</span>
                      </Link>
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

export default AttentionLadder;
