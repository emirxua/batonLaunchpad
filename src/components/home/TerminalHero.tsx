"use client";

import React from "react";
import useSWR from "swr";
import { Zap, Flame, Radio, Activity, Terminal } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TerminalHero() {
  const { data: dirData } = useSWR("/api/directory", fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  const { data: burnsData } = useSWR("/api/burns", fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  const { data: calloutData } = useSWR("/api/callouts", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  });

  const totalBurned = burnsData?.totalBurnedAmount ?? 27777;
  const totalVolume24h = dirData?.marketOverview?.totalVolume24h ?? 10850000;
  const activeCalloutsCount = calloutData?.count ?? calloutData?.callouts?.length ?? 58;

  return (
    <div className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/80 text-xs font-mono select-none overflow-x-auto no-scrollbar shadow-sm">
      {/* Left: Minimal Indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="font-extrabold text-[11px] text-zinc-900 dark:text-white uppercase tracking-wider">
          OUTBID OVERVIEW
        </span>
      </div>

      {/* Right: Razor-Thin Metrics Strip */}
      <div className="flex items-center gap-2 sm:gap-3 text-[11px] shrink-0 font-mono">
        <div className="flex items-center gap-1 text-zinc-500">
          <Activity className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-zinc-400 uppercase">24H Vol:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-200">
            {formatCurrency(totalVolume24h)}
          </span>
        </div>

        <span className="text-zinc-300 dark:text-zinc-800">•</span>

        <div className="flex items-center gap-1 text-zinc-500">
          <Radio className="w-3 h-3 text-rose-500" />
          <span className="text-[10px] text-zinc-400 uppercase">Signals:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-200">
            {activeCalloutsCount}
          </span>
        </div>

        <span className="text-zinc-300 dark:text-zinc-800">•</span>

        <div className="flex items-center gap-1 text-zinc-500">
          <Flame className="w-3 h-3 text-orange-500 fill-current" />
          <span className="text-[10px] text-zinc-400 uppercase">Burned:</span>
          <span className="font-bold text-amber-500 dark:text-amber-400">
            {totalBurned >= 1_000_000
              ? `${(totalBurned / 1_000_000).toFixed(2)}M`
              : totalBurned >= 1_000
              ? `${(totalBurned / 1_000).toFixed(1)}K`
              : formatNumber(totalBurned)}{" "}
            $BATON
          </span>
        </div>
      </div>
    </div>
  );
}

export default TerminalHero;
