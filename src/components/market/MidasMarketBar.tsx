"use client";

import React from "react";
import { useMarketStats } from "@/hooks/useMarketData";
import { TrendingUp, TrendingDown, Flame, Zap } from "lucide-react";

export function MidasMarketBar() {
  const { markets } = useMarketStats();

  return (
    <div className="w-full bg-[#0D1117] border-b border-zinc-200 dark:border-white/10 px-4 py-2 font-mono text-xs select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-6 shrink-0">
          {markets.length === 0 ? (
            <div className="flex items-center gap-2 text-zinc-500 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Streaming global market data…</span>
            </div>
          ) : (
            markets.map((item) => (
              <div key={item.symbol} className="flex items-center gap-2">
                <span className="font-bold text-zinc-400">${item.symbol}</span>
                <span className="font-extrabold text-white">{item.priceFormatted}</span>
                <span
                  className={`flex items-center text-[10px] font-bold ${
                    item.isPositive ? "text-emerald-400" : "text-rose-500"
                  }`}
                >
                  {item.isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {item.changeFormatted}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 text-amber-500 font-bold text-[11px]">
          <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
          <span>Ecosystem Fuel: $BATON Burn-to-Rank</span>
        </div>
      </div>
    </div>
  );
}

export default MidasMarketBar;
