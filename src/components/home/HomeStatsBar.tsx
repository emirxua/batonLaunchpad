"use client";

import React from "react";
import useSWR from "swr";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface HomeStatsBarProps {
  totalBurned?: number;
  leaderTicker?: string;
  leaderMcap?: number;
  activeRooms?: number;
  totalVolume24h?: number;
  isLoading?: boolean;
  onOutbidClick?: () => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function HomeStatsBar({
  totalBurned: propBurned,
  leaderTicker: propTicker,
  leaderMcap: propMcap,
  activeRooms: propRooms,
  totalVolume24h: propVol,
  isLoading: propLoading,
  onOutbidClick,
}: HomeStatsBarProps) {
  const { data: dirData, isLoading: dirLoading } = useSWR(
    propBurned === undefined ? "/api/directory" : null,
    fetcher,
    {
      refreshInterval: 15_000,
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
    }
  );

  const totalBurned = propBurned ?? dirData?.totalBurned ?? 0;
  const leaderTicker = propTicker ?? dirData?.marketOverview?.attentionLeaderTicker ?? "BATON";
  const leaderMcap = propMcap ?? dirData?.marketOverview?.attentionLeaderMcap ?? 0;
  const activeRooms = propRooms ?? dirData?.marketOverview?.activeRooms ?? 0;
  const totalVolume24h = propVol ?? dirData?.marketOverview?.totalVolume24h ?? 0;
  const isLoading = propLoading ?? dirLoading;

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 px-4 py-2 rounded-lg flex items-center justify-between gap-4 font-mono text-xs text-zinc-500 dark:text-zinc-400 overflow-x-auto no-scrollbar select-none">
      {/* Metrics Row */}
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap min-w-0">
        {/* On-Chain Burned */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
            ON-CHAIN BURNED:
          </span>
          <span className="font-bold text-amber-400 text-xs">
            {isLoading && totalBurned === 0 ? "..." : `${formatNumber(totalBurned)} $BATON`}
          </span>
        </div>

        <span className="text-zinc-400 dark:text-zinc-700 hidden sm:inline select-none">|</span>

        {/* Attention Leader */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
            ATTENTION LEADER:
          </span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
            <span className="text-amber-400">${leaderTicker}</span>{" "}
            {leaderMcap > 0 && (
              <span className="text-zinc-500 font-normal">
                ({formatCurrency(leaderMcap)})
              </span>
            )}
          </span>
        </div>

        <span className="text-zinc-400 dark:text-zinc-700 hidden sm:inline select-none">|</span>

        {/* Active Rooms */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
            ACTIVE ROOMS:
          </span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
            {isLoading && activeRooms === 0 ? "..." : activeRooms}
          </span>
        </div>

        <span className="text-zinc-400 dark:text-zinc-700 hidden sm:inline select-none">|</span>

        {/* 24h Volume */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
            24H VOLUME:
          </span>
          <span className="font-bold text-emerald-500 dark:text-emerald-400 text-xs">
            {isLoading && totalVolume24h === 0 ? "..." : formatCurrency(totalVolume24h)}
          </span>
        </div>
      </div>

      {/* Right: Outbid #1 Spot Button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOutbidClick}
          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          [ OUTBID #1 SPOT ]
        </button>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>
    </div>
  );
}

export default HomeStatsBar;
