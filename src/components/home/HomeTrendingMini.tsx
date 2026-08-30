"use client";

import React from "react";
import Link from "next/link";
import useSWR from "swr";
import { Zap, ArrowRight, RefreshCw } from "lucide-react";

interface HomeTrendingMiniProps {
  onSelectSwapToken?: (mint: string, symbol: string, name?: string, iconUrl?: string) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function HomeTrendingMini({ onSelectSwapToken }: HomeTrendingMiniProps) {
  const { data, isLoading } = useSWR(
    "/api/trending",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  );

  const rawTokens = data?.tokens || data?.data || [];
  const items = rawTokens.slice(0, 4);

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-white/10 flex flex-col font-mono overflow-hidden shadow-2xl select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-500 dark:text-amber-400 tracking-wide flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>TRENDING ALPHA MOVERS</span>
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-bold bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/5">
          LIVE DEX
        </span>
      </div>

      {/* Token List */}
      <div className="p-3 flex flex-col gap-2">
        {items.length === 0 && (
          <div className="py-6 text-center text-xs text-zinc-500">
            {isLoading ? "Fetching live Solana pairs…" : "No active pairs found."}
          </div>
        )}

        {items.map((token: any) => {
          const isPositive = (token.priceChange24h ?? 0) >= 0;
          const priceFormatted =
            token.priceUsd < 0.001
              ? `$${token.priceUsd.toFixed(6)}`
              : `$${token.priceUsd.toFixed(4)}`;
          const mcapFormatted =
            token.marketCap >= 1e6
              ? `$${(token.marketCap / 1e6).toFixed(1)}M`
              : `$${(token.marketCap / 1e3).toFixed(0)}K`;

          return (
            <div
              key={token.mint}
              onClick={() => {
                if (onSelectSwapToken) {
                  onSelectSwapToken(token.mint, token.symbol, token.name, token.iconUrl || token.imageUrl);
                }
              }}
              className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 hover:border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden text-[10px] font-bold text-amber-400 shrink-0">
                  {token.iconUrl ? (
                    <img
                      src={token.iconUrl}
                      alt={token.symbol}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    token.symbol?.slice(0, 3)?.toUpperCase() || "SOL"
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
                    ${token.symbol}
                  </span>
                  <span className="text-[10px] text-zinc-500 truncate max-w-[90px]">
                    MC: {mcapFormatted}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {priceFormatted}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {token.priceChange24h?.toFixed(1) || 0}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectSwapToken) {
                      onSelectSwapToken(token.mint, token.symbol, token.name);
                    }
                  }}
                  className="text-[10px] font-bold px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 border border-amber-500/30 transition-all uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  SWAP
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/20">
        <Link
          href="/terminal"
          className="text-xs font-bold text-zinc-500 hover:text-amber-400 transition-colors flex items-center justify-between"
        >
          <span>OPEN ADVANCED TERMINAL</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default HomeTrendingMini;
