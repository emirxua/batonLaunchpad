"use client";

import React, { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import useSWR from "swr";
import { DexTrendingToken, TerminalActiveTab } from "@/lib/types/terminal";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import { formatCurrency } from "@/lib/utils";
import {
  Flame,
  Rocket,
  Droplets,
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  ExternalLink,
  ArrowRightLeft,
  Loader2,
  Star,
} from "lucide-react";

interface TrendingApiResponse {
  updatedAt: number;
  count: number;
  tokens: DexTrendingToken[];
  error?: string;
}

interface TrendingTableProps {
  selectedMint?: string;
  onSelectToken: (mint: string, symbol: string) => void;
  onTradeToken?: (token: DexTrendingToken) => void;
}

const fetcher = (url: string): Promise<TrendingApiResponse> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

function formatPrice(val: number): string {
  if (!val || isNaN(val)) return "$0.00";
  if (val >= 1) {
    return `$${val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  }
  if (val < 0.000001) return `$${val.toFixed(8)}`;
  return `$${val.toFixed(6)}`;
}

export const TrendingTable: React.FC<TrendingTableProps> = ({
  selectedMint,
  onSelectToken,
  onTradeToken,
}) => {
  const [activeTab, setActiveTab] = useState<TerminalActiveTab>("all");
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const { toggleWatchToken, isWatchedToken } = useWatchlist();

  // Map tab to API sortBy parameter
  const sortByParam =
    activeTab === "gainers"
      ? "gainers"
      : activeTab === "volume"
      ? "volume"
      : "trending";
  const apiUrl = `/api/trending?limit=30&minMcap=70000&sortBy=${sortByParam}`;

  const { data, isLoading, error } = useSWR<TrendingApiResponse>(
    apiUrl,
    fetcher,
    {
      refreshInterval: 60_000,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 2,
      errorRetryInterval: 10_000,
      keepPreviousData: true,
    }
  );

  const tokens = useMemo(() => data?.tokens || [], [data?.tokens]);

  const handleCopy = React.useCallback((mint: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  }, []);

  const handleTradeClick = React.useCallback((token: DexTrendingToken, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectToken(token.mint, token.symbol);
    onTradeToken?.(token);
  }, [onSelectToken, onTradeToken]);

  return (
    <div className="w-full bg-[#0D0E12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* ── Table Top Bar & Tabs ───────────────────────────────────────── */}
      <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/60">
        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-white/5 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Trending</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gainers")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "gainers"
                ? "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Top Gainers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("volume")}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "volume"
                ? "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>High Volume</span>
          </button>
        </div>

        {/* Live Status */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
          {isLoading && (
            <span className="flex items-center gap-1 text-orange-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Updating DexScreener…</span>
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            {tokens.length} Solana Tokens
          </span>
        </div>
      </div>

      {/* ── Table Component ────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-zinc-950/90 text-zinc-500 text-[10px] uppercase tracking-wider select-none">
              <th className="py-3 px-4 w-16 text-center">#</th>
              <th className="py-3 px-4">Token</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">24h Change</th>
              <th className="py-3 px-4 text-right">Market Cap</th>
              <th className="py-3 px-4 text-right">24h Volume</th>
              <th className="py-3 px-4 text-center w-28">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {isLoading && tokens.length === 0 ? (
              // Skeleton rows
              [1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4 text-center">
                    <div className="h-4 w-4 bg-zinc-800 rounded mx-auto" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-20 bg-zinc-800 rounded" />
                        <div className="h-2.5 w-14 bg-zinc-800/60 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-4 w-16 bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-4 w-12 bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-4 w-16 bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-4 w-16 bg-zinc-800 rounded ml-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="h-7 w-16 bg-zinc-800 rounded mx-auto" />
                  </td>
                </tr>
              ))
            ) : error && tokens.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-zinc-500 font-mono text-xs"
                >
                  Failed to load trending tokens from DexScreener. Retrying...
                </td>
              </tr>
            ) : tokens.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-zinc-500 font-mono text-xs"
                >
                  No tokens matching criteria.
                </td>
              </tr>
            ) : (
              tokens.map((token: DexTrendingToken, index: number) => {
                const isSelected =
                  selectedMint?.toLowerCase() === token.mint.toLowerCase();
                const isPositive = token.priceChange24h >= 0;
                const isFav = isWatchedToken(token.mint);

                return (
                  <tr
                    key={token.mint}
                    onClick={() => onSelectToken(token.mint, token.symbol)}
                    className={`transition-colors cursor-pointer group select-none ${
                      isSelected
                        ? "bg-orange-500/15 hover:bg-orange-500/20"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* Rank & Favorite Star */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchToken(token.mint);
                          }}
                          className="p-1 hover:scale-125 transition-transform cursor-pointer"
                          title={isFav ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                          <Star
                            className={`w-3.5 h-3.5 transition-colors ${
                              isFav
                                ? "fill-amber-400 text-amber-400"
                                : "text-zinc-600 hover:text-amber-400"
                            }`}
                          />
                        </button>
                        <span className="font-bold text-zinc-500 group-hover:text-orange-400 transition-colors text-xs">
                          {index + 1}
                        </span>
                      </div>
                    </td>

                    {/* Token Info: Logo, Symbol, Name, CA */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {token.iconUrl ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                            <Image
                              src={token.iconUrl}
                              alt={token.symbol}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0 uppercase">
                            {token.symbol.slice(0, 2)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs truncate">
                              ${token.symbol}
                            </span>
                            <span className="text-[10px] text-zinc-400 truncate max-w-[110px]">
                              {token.name}
                            </span>
                          </div>

                          {/* CA with Copy */}
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <span>
                              {token.mint.slice(0, 4)}…{token.mint.slice(-4)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(token.mint, e)}
                              className="hover:text-orange-400 transition-colors p-0.5"
                              title="Copy CA"
                            >
                              {copiedMint === token.mint ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {formatPrice(token.priceUsd)}
                    </td>

                    {/* 24h Change */}
                    <td className="py-3.5 px-4 text-right">
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
                          {token.priceChange24h.toFixed(2)}%
                        </span>
                      </div>
                    </td>

                    {/* Market Cap */}
                    <td className="py-3.5 px-4 text-right text-zinc-300 font-medium">
                      {formatCurrency(token.marketCap)}
                    </td>

                    {/* 24h Volume */}
                    <td className="py-3.5 px-4 text-right text-zinc-400">
                      {formatCurrency(token.volume24h)}
                    </td>

                    {/* Trade Action Button */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleTradeClick(token, e)}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500 border border-orange-500/40 text-orange-400 hover:text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Trade</span>
                        </button>

                        <a
                          href={`https://dexscreener.com/solana/${token.mint}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                          title="Open DexScreener"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
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
};
