"use client";

import React from "react";
import { useMarketStats } from "@/hooks/useMarketData";
import { Sparkline } from "../market/Sparkline";

export function GlobalMarkets() {
  const { markets, isLoading } = useMarketStats();

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-white/10 p-4 font-mono select-none shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold tracking-wider uppercase text-zinc-700 dark:text-zinc-300">
            GLOBAL MARKETS 24H
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 font-mono">
            OUTBID FAST FEED
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {markets.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-zinc-500">
            {isLoading ? "Connecting to live global market feeds…" : "Live market feeds unavailable."}
          </div>
        )}
        {markets.map((token) => {
          const isPositive = token.isPositive;

          return (
            <div
              key={token.symbol}
              className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-lg p-3.5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-white/10 transition-colors"
            >
              {/* Top Row: Symbol / Name + Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {token.symbol}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                    {token.name}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {token.changeFormatted}
                </span>
              </div>

              {/* Middle Row: Price + Sparkline */}
              <div className="flex items-end justify-between my-2">
                <div className="font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {token.priceFormatted}
                </div>
                <div className="w-20 h-6 shrink-0 flex items-center justify-end">
                  <Sparkline
                    data={token.sparkline}
                    isPositive={isPositive}
                    symbol={token.symbol}
                    width={76}
                    height={22}
                  />
                </div>
              </div>

              {/* Bottom Row: Volume */}
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 tracking-wider">
                VOL: {token.volumeFormatted}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GlobalMarkets;
