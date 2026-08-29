"use client";

import React from "react";
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

export function HomeStatsBar({
  totalBurned = 0,
  leaderTicker = "BATON",
  leaderMcap = 0,
  activeRooms = 0,
  totalVolume24h = 0,
  isLoading = false,
  onOutbidClick,
}: HomeStatsBarProps) {
  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 px-4 py-2 rounded-lg flex items-center justify-between gap-4 font-mono text-xs text-zinc-500 dark:text-zinc-400 overflow-x-auto no-scrollbar select-none">
      {/* Metrics Row */}
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap min-w-0">
        {/* On-Chain Burned */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
            ON-CHAIN BURNED:
          </span>
          {isLoading ? (
            <span className="inline-block h-3.5 w-16 bg-zinc-800 rounded animate-pulse" />
          ) : (
            <span className="font-bold text-amber-400 text-xs">
              {formatNumber(totalBurned)} $BATON
            </span>
          )}
        </div>

        <span className="text-zinc-700 hidden sm:inline select-none">|</span>

        {/* Attention Leader */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
            ATTENTION LEADER:
          </span>
          {isLoading ? (
            <span className="inline-block h-3.5 w-16 bg-zinc-800 rounded animate-pulse" />
          ) : (
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
              <span className="text-amber-400">${leaderTicker}</span>{" "}
              <span className="text-zinc-500 dark:text-zinc-400 font-normal">
                ({formatCurrency(leaderMcap)})
              </span>
            </span>
          )}
        </div>

        <span className="text-zinc-700 hidden md:inline select-none">|</span>

        {/* Active Rooms */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
            ACTIVE ROOMS:
          </span>
          {isLoading ? (
            <span className="inline-block h-3.5 w-8 bg-zinc-800 rounded animate-pulse" />
          ) : (
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">{activeRooms}</span>
          )}
        </div>

        <span className="text-zinc-700 hidden md:inline select-none">|</span>

        {/* 24H Volume */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
            24H VOLUME:
          </span>
          {isLoading ? (
            <span className="inline-block h-3.5 w-14 bg-zinc-800 rounded animate-pulse" />
          ) : (
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
              {formatCurrency(totalVolume24h)}
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onOutbidClick}
        className="shrink-0 px-3.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 font-mono text-[11px] font-bold tracking-wider transition-all hover:border-amber-500/70 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] active:scale-95 cursor-pointer uppercase"
      >
        [ OUTBID #1 SPOT ]
      </button>
    </div>
  );
}

export default HomeStatsBar;
