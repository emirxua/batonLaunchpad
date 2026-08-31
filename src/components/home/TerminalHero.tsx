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
    <div className="w-full px-2.5 sm:px-4 py-1.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/80 dark:bg-[#0c0d12]/80 backdrop-blur-md text-xs font-mono select-none shadow-sm">
      <div className="grid grid-cols-3 sm:flex sm:items-center sm:justify-between gap-1.5 sm:gap-4 text-[10px] sm:text-[11px] font-mono">
        <div className="flex items-center gap-1 text-zinc-500 justify-center sm:justify-start">
          <Activity className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="text-zinc-400 uppercase hidden md:inline">24H Vol:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-200 truncate">
            {formatCurrency(totalVolume24h)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-zinc-500 justify-center border-x sm:border-x-0 border-zinc-200 dark:border-white/5 px-1 sm:px-0">
          <Radio className="w-3 h-3 text-rose-500 shrink-0" />
          <span className="text-zinc-400 uppercase hidden md:inline">Signals:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-200">
            {activeCalloutsCount}
          </span>
        </div>

        <div className="flex items-center gap-1 text-zinc-500 justify-center sm:justify-end">
          <Flame className="w-3 h-3 text-orange-500 fill-current shrink-0" />
          <span className="text-zinc-400 uppercase hidden md:inline">Burned:</span>
          <span className="font-bold text-amber-500 dark:text-amber-400 truncate">
            {totalBurned >= 1_000_000
              ? `${(totalBurned / 1_000_000).toFixed(1)}M`
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
