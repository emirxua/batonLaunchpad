"use client";

import React from "react";
import useSWR from "swr";
import { BinanceMarketData } from "@/lib/types/terminal";
import { Sparkline } from "./Sparkline";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MarketStatsApiResponse {
  updatedAt: number;
  data: BinanceMarketData[];
}

const fetcher = (url: string): Promise<MarketStatsApiResponse> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP error ${r.status}`);
    return r.json();
  });

function formatPrice(price: number): string {
  if (!price && price !== 0) return "—";
  if (price >= 1000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (price >= 1) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  });
}

function cleanSymbol(sym: string): { label: string; name: string } {
  const upper = sym.toUpperCase();
  if (upper.includes("SOL")) return { label: "SOL", name: "Solana" };
  if (upper.includes("BTC")) return { label: "BTC", name: "Bitcoin" };
  if (upper.includes("ETH")) return { label: "ETH", name: "Ethereum" };
  if (upper.includes("BNB")) return { label: "BNB", name: "BNB Chain" };
  return { label: upper.replace("USDT", ""), name: upper };
}

export const MidasMarketBar: React.FC = () => {
  const { data, isLoading, error } = useSWR<MarketStatsApiResponse>(
    "/api/market-stats",
    fetcher,
    {
      refreshInterval: 45_000,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 2,
      errorRetryInterval: 10_000,
      keepPreviousData: true,
    }
  );

  const marketList = data?.data || [];

  return (
    <div className="w-full bg-[#0D0E12] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl">
      {/* Top Header / Live Indicator */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-orange-400" />
            Global Markets 24H
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
          <span>Spot Market Pulse</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold">
            Live Feed (45s)
          </span>
        </div>
      </div>

      {/* Grid of 4 Market Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading && marketList.length === 0 ? (
          // Zinc Skeleton Loaders
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/5 animate-pulse flex flex-col justify-between h-24"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-14 bg-zinc-800 rounded" />
                <div className="h-4 w-12 bg-zinc-800 rounded" />
              </div>
              <div className="flex justify-between items-end">
                <div className="h-6 w-20 bg-zinc-800 rounded" />
                <div className="h-8 w-20 bg-zinc-800/60 rounded" />
              </div>
            </div>
          ))
        ) : error && marketList.length === 0 ? (
          <div className="col-span-full py-4 text-center text-xs font-mono text-zinc-500">
            Market rates temporarily unavailable. Reconnecting...
          </div>
        ) : (
          marketList.map((item) => {
            const isPositive = item.priceChangePercent24h >= 0;
            const { label, name } = cleanSymbol(item.symbol);

            return (
              <div
                key={item.symbol}
                className="p-3.5 rounded-xl bg-zinc-950/90 border border-white/10 hover:border-orange-500/40 transition-all shadow-md group flex flex-col justify-between gap-2"
              >
                {/* Header: Symbol + Name + 24h Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-archivo font-black text-sm text-white tracking-wide">
                      ${label}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 truncate">
                      {name}
                    </span>
                  </div>

                  <div
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {item.priceChangePercent24h.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Price & Real 24h Sparkline */}
                <div className="flex items-end justify-between gap-3 pt-1">
                  <div className="space-y-0.5">
                    <div className="font-mono text-base sm:text-lg font-bold text-white tracking-tight">
                      ${formatPrice(item.price)}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase">
                      Vol: ${Math.round(item.volume24h * item.price).toLocaleString("en-US", { notation: "compact" })}
                    </div>
                  </div>

                  {/* Sparkline Chart */}
                  <div className="shrink-0">
                    <Sparkline
                      data={item.sparkline}
                      isPositive={isPositive}
                      width={84}
                      height={28}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
