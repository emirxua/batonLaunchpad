"use client";

import React from "react";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";

export const Ticker: React.FC = React.memo(() => {
  const { featuredCoin, isLoading } = useCoinsData(20_000);
  const { totalBurned } = useTokenStats(20_000);

  const priceStr = featuredCoin?.priceUsd
    ? `$${featuredCoin.priceUsd < 0.01 ? featuredCoin.priceUsd.toFixed(8) : featuredCoin.priceUsd.toFixed(4)}`
    : "$0.00001250";
  const change24h = featuredCoin?.change24h ?? 0;
  const isPositive = change24h >= 0;
  const mcapStr = featuredCoin?.marketCap
    ? `$${Math.round(featuredCoin.marketCap).toLocaleString("en-US")}`
    : "$12,500";
  const volumeStr = featuredCoin?.volume24h
    ? `$${Math.round(featuredCoin.volume24h).toLocaleString("en-US")}`
    : "$1,840";

  const tickerSegments = [
    { label: "$BATON (pump.fun)", value: priceStr, isLoading },
    { label: "24h Change", value: `${isPositive ? "+" : ""}${change24h.toFixed(2)}%`, isChange: true, isLoading },
    { label: "Market Cap", value: mcapStr, isLoading },
    { label: "24h Volume", value: volumeStr, isLoading },
    { label: "CA", value: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump", isCA: true },
    { label: "ON-CHAIN BURNED", value: `${Math.round(totalBurned).toLocaleString("en-US")} $BATON` },
  ];

  return (
    <div className="w-full bg-zinc-900 text-zinc-300 dark:bg-zinc-950 border-b border-zinc-800 h-7 flex items-center overflow-hidden select-none z-50 relative font-mono text-[11px] font-bold">
      {/* Live Badge */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 h-full bg-black text-emerald-400 dark:text-acid uppercase tracking-wider text-[10px] font-black z-10 shrink-0 border-r border-zinc-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-acid animate-ping" />
        <span>DEXSCREENER LIVE · 20S</span>
      </div>

      {/* Marquee Wrapper */}
      <div className="flex overflow-hidden w-full group">
        <div className="animate-marquee-gpu items-center">
          {/* Render 1 */}
          {tickerSegments.map((seg, idx) => (
            <div key={`seg1-${idx}`} className="flex items-center gap-1.5 px-4 whitespace-nowrap">
              <span className="text-zinc-400 uppercase text-[10px]">{seg.label}:</span>
              {seg.isLoading && !featuredCoin ? (
                <span className="inline-block w-14 h-3.5 bg-zinc-800 rounded animate-pulse" />
              ) : (
                <span
                  className={`font-black ${
                    seg.isChange
                      ? isPositive
                        ? "text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/40"
                        : "text-rose-400 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-800/40"
                      : seg.isCA
                      ? "text-zinc-400 font-mono text-[10px]"
                      : "text-zinc-100"
                  }`}
                >
                  {seg.value}
                </span>
              )}
              <span className="text-zinc-700 ml-2">/</span>
            </div>
          ))}

          {/* Render 2 (seamless repeat) */}
          {tickerSegments.map((seg, idx) => (
            <div key={`seg2-${idx}`} className="flex items-center gap-1.5 px-4 whitespace-nowrap">
              <span className="text-zinc-400 uppercase text-[10px]">{seg.label}:</span>
              {seg.isLoading && !featuredCoin ? (
                <span className="inline-block w-14 h-3.5 bg-zinc-800 rounded animate-pulse" />
              ) : (
                <span
                  className={`font-black ${
                    seg.isChange
                      ? isPositive
                        ? "text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/40"
                        : "text-rose-400 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-800/40"
                      : seg.isCA
                      ? "text-zinc-400 font-mono text-[10px]"
                      : "text-zinc-100"
                  }`}
                >
                  {seg.value}
                </span>
              )}
              <span className="text-zinc-700 ml-2">/</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

Ticker.displayName = "Ticker";
