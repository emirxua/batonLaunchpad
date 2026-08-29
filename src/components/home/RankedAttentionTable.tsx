"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Coin } from "@/types/coin";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Copy, Check, TrendingUp, TrendingDown, Flame } from "lucide-react";

interface RankedAttentionTableProps {
  coins: Coin[];
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
  coins = [],
  isLoading = false,
  onOutbidClick,
}: RankedAttentionTableProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  const handleCopy = (mint: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  // Filter coins by category (excluding #1 which is shown in King of Hill, or showing all filtered)
  const filteredCoins = useMemo(() => {
    if (selectedCategory === "all") return coins;
    return coins.filter(
      (c) => c.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [coins, selectedCategory]);

  return (
    <div className="w-full bg-zinc-900/40 border border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col font-mono">
      {/* Top Header + Category Filters */}
      <div className="p-4 border-b border-white/5 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
            RANKED ATTENTION LADDER
          </span>
          <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5">
            {filteredCoins.length} TRACKED
          </span>
        </div>

        {/* Text-based Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                [ {cat.label} ]
              </button>
            );
          })}
        </div>
      </div>

      {/* Tight Table Content */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-zinc-950/80 text-zinc-500 text-[10px] uppercase tracking-wider select-none">
              <th className="py-2.5 px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-4">Token</th>
              <th className="py-2.5 px-4 text-right">Market Cap</th>
              <th className="py-2.5 px-4 text-right">24h Change</th>
              <th className="py-2.5 px-4 text-right">Total Burn</th>
              <th className="py-2.5 px-4 text-center w-28">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {isLoading && filteredCoins.length === 0 ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4 text-center">
                    <div className="h-3 w-4 bg-zinc-800 rounded mx-auto" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-zinc-800" />
                      <div className="h-3 w-24 bg-zinc-800 rounded" />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="h-3 w-16 bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="h-3 w-12 bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="h-3 w-16 bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="h-6 w-16 bg-zinc-800 rounded mx-auto" />
                  </td>
                </tr>
              ))
            ) : filteredCoins.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-zinc-500 font-mono text-xs"
                >
                  No tokens currently listed in {selectedCategory.toUpperCase()}.
                </td>
              </tr>
            ) : (
              filteredCoins.map((token, idx) => {
                const rankNumber = idx + 2; // Starts from #2 since #1 is spotlighted
                const isPositive = (token.change24h || 0) >= 0;
                const shortMint = `${token.mintAddress.slice(0, 4)}...${token.mintAddress.slice(-4)}`;

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
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-800 border border-white/10 shrink-0 flex items-center justify-center">
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
                            <span className="font-bold text-white text-xs truncate">
                              ${token.ticker}
                            </span>
                            <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">
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
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Market Cap */}
                    <td className="py-3 px-4 text-right text-zinc-300 font-medium">
                      {formatCurrency(token.marketCap || 0)}
                    </td>

                    {/* 24h Change */}
                    <td className="py-3 px-4 text-right">
                      <div
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {isPositive ? "+" : ""}
                          {(token.change24h || 0).toFixed(2)}%
                        </span>
                      </div>
                    </td>

                    {/* Total Burn */}
                    <td className="py-3 px-4 text-right text-amber-400 font-bold">
                      {formatNumber(token.totalBurnedBaton || 0)}{" "}
                      <span className="text-[10px] text-zinc-500 font-normal">
                        $BATON
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
