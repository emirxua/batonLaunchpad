"use client";
import React from "react";
import useSWR from "swr";
import { Sparkline } from "./Sparkline";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface MarketToken {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

function formatVol(vol: number): string {
  if (!vol || isNaN(vol)) return "VOL: --";
  if (vol >= 1e9) return `VOL: $${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `VOL: $${(vol / 1e6).toFixed(1)}M`;
  return `VOL: $${(vol / 1e3).toFixed(0)}K`;
}

export function MidasMarketBar() {
  const { data, isLoading } = useSWR("/api/market-stats", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const tokens: MarketToken[] = data?.data || [];

  return (
    <div className="w-full bg-zinc-950 rounded-xl border border-white/10 p-4 font-mono select-none shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>GLOBAL MARKETS 24H</span>
        </div>
        <span className="text-[11px] text-zinc-500">Spot Market Pulse (15s)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading && tokens.length === 0 ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-zinc-900/40 border border-white/5 rounded-lg p-3.5 h-24 animate-pulse flex flex-col justify-between"
            >
              <div className="flex justify-between">
                <div className="h-4 w-16 bg-zinc-800 rounded" />
                <div className="h-4 w-12 bg-zinc-800 rounded" />
              </div>
              <div className="flex justify-between items-end">
                <div className="h-5 w-20 bg-zinc-800 rounded" />
                <div className="h-6 w-24 bg-zinc-800/60 rounded" />
              </div>
            </div>
          ))
        ) : (
          tokens.map((token: MarketToken) => {
            const isPositive = token.priceChangePercent24h >= 0;
            return (
              <div
                key={token.symbol}
                className="bg-zinc-900/40 border border-white/5 rounded-lg p-3.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-zinc-100">${token.symbol}</span>
                    <span className="text-[11px] text-zinc-500">{token.name}</span>
                  </div>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {token.priceChangePercent24h.toFixed(2)}%
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <div className="text-base font-bold text-zinc-100">
                      $
                      {token.price >= 1
                        ? token.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : token.price.toFixed(4)}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {formatVol(token.volume24h)}
                    </div>
                  </div>

                  {/* DİNAMİK SPARKLINE: Her coinin kendi bağımsız array'i aktarılıyor */}
                  <div className="flex items-center justify-end">
                    <Sparkline
                      data={token.sparkline || []}
                      isPositive={isPositive}
                      symbol={token.symbol}
                      width={110}
                      height={32}
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
}

export default MidasMarketBar;
