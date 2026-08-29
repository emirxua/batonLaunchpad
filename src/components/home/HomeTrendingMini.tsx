"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { Zap, ArrowRight, Loader2 } from "lucide-react";

interface TrendingItem {
  mint?: string;
  address?: string;
  name?: string;
  symbol: string;
  priceUsd?: number;
  price?: number;
  marketCap: number;
  priceChange24h?: number;
  iconUrl?: string | null;
  icon?: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function HomeTrendingMini() {
  const { data, isLoading } = useSWR("/api/trending", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const rawList: TrendingItem[] = Array.isArray(data?.tokens)
    ? data.tokens
    : Array.isArray(data?.data)
    ? data.data
    : [];

  // Gelen veriden ilk 4 trend coin
  const items = rawList.slice(0, 4);

  return (
    <div className="w-full bg-zinc-950 rounded-xl border border-white/10 flex flex-col font-mono overflow-hidden shadow-2xl select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-400 tracking-wide flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>TRENDING ALPHA MOVERS</span>
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5">
          &gt;$70K MC
        </span>
      </div>

      {/* Token Listesi */}
      <div className="p-3 flex flex-col gap-2">
        {isLoading && items.length === 0 ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-zinc-500 font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>LOADING TRENDING PAIRS...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-500">
            No trending movers available.
          </div>
        ) : (
          items.map((token: TrendingItem) => {
            const isPositive = (token.priceChange24h || 0) >= 0;
            const tokenMint = token.mint || token.address || "";
            const tokenPrice = token.priceUsd ?? token.price ?? 0;
            const tokenIcon = token.iconUrl || token.icon || null;

            return (
              <div
                key={tokenMint || token.symbol}
                className="bg-zinc-900/40 border border-white/5 hover:border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden text-[10px] font-bold text-zinc-300 shrink-0">
                    {tokenIcon ? (
                      <Image
                        src={tokenIcon}
                        alt={token.symbol}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      token.symbol?.slice(0, 3).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
                      ${token.symbol}
                    </span>
                    <span className="text-[10px] text-zinc-500 truncate max-w-[90px]">
                      MC: $
                      {token.marketCap >= 1000000
                        ? `${(token.marketCap / 1e6).toFixed(2)}M`
                        : `${(token.marketCap / 1e3).toFixed(1)}K`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-zinc-200">
                      $
                      {tokenPrice < 0.01
                        ? tokenPrice.toFixed(6)
                        : tokenPrice.toFixed(3)}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {(token.priceChange24h || 0).toFixed(2)}%
                    </span>
                  </div>
                  <Link
                    href={`/terminal?token=${tokenMint}&outputMint=${tokenMint}`}
                    className="text-[10px] font-bold px-2.5 py-1 rounded bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 border border-white/5 transition-all uppercase tracking-wider"
                  >
                    TRADE
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Link */}
      <div className="px-4 py-2.5 border-t border-white/5 bg-zinc-900/20">
        <Link
          href="/terminal"
          className="text-[11px] text-zinc-400 hover:text-amber-400 transition-colors flex items-center justify-between font-bold"
        >
          <span>VIEW FULL TERMINAL</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default HomeTrendingMini;
