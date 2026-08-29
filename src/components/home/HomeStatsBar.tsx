"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { TokenStatsResponse } from "@/app/api/token-stats/route";
import { Coin } from "@/types/coin";
import { formatNumber, formatCurrency } from "@/lib/utils";

// ── Fetchers ──────────────────────────────────────────────────────────────────
const fetcher = <T>(url: string): Promise<T> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

interface CoinsApiResponse {
  success: boolean;
  count: number;
  data: Coin[];
}

// ── Skeleton helper ───────────────────────────────────────────────────────────
function Pulse({ w = "w-16" }: { w?: string }) {
  return (
    <span
      className={`inline-block h-3 ${w} rounded bg-zinc-700/60 animate-pulse`}
    />
  );
}

// ── Stat item ─────────────────────────────────────────────────────────────────
function StatItem({
  label,
  value,
  loading,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-zinc-500 uppercase tracking-wider text-[10px]">
        {label}:
      </span>
      {loading ? (
        <Pulse />
      ) : (
        <span
          className={`font-bold text-[11px] ${
            highlight ? "text-amber-400" : "text-zinc-200"
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <span className="text-zinc-700 select-none hidden sm:inline">|</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────
interface HomeStatsBarProps {
  onOutbidClick?: () => void;
}

export function HomeStatsBar({ onOutbidClick }: HomeStatsBarProps) {
  // On-chain $BATON burn stats
  const { data: tokenStats, isLoading: burnLoading } =
    useSWR<TokenStatsResponse>("/api/token-stats", fetcher, {
      refreshInterval: 30_000,
      dedupingInterval: 15_000,
      revalidateOnFocus: false,
      errorRetryCount: 2,
    });

  // Directory coins (attention leaders)
  const { data: coinsRes, isLoading: coinsLoading } =
    useSWR<CoinsApiResponse>("/api/coins", fetcher, {
      refreshInterval: 60_000,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      errorRetryCount: 2,
    });

  // Derive attention leader (coin with highest market cap among listed)
  const leader = useMemo(() => {
    const coins = coinsRes?.data ?? [];
    if (coins.length === 0) return null;
    return coins.reduce((best, c) =>
      (c.marketCap ?? 0) > (best.marketCap ?? 0) ? c : best
    );
  }, [coinsRes]);

  // Active rooms = coins with volume in last 24h
  const activeRooms = useMemo(() => {
    return (coinsRes?.data ?? []).filter((c) => (c.volume24h ?? 0) > 0).length;
  }, [coinsRes]);

  // Total 24h volume across all listed coins
  const totalVolume24h = useMemo(() => {
    return (coinsRes?.data ?? []).reduce(
      (sum, c) => sum + (c.volume24h ?? 0),
      0
    );
  }, [coinsRes]);

  const isCoinsLoading = coinsLoading && !coinsRes;
  const isBurnLoading = burnLoading && !tokenStats;

  return (
    <div className="w-full bg-zinc-900/40 border border-white/5 px-4 py-2 rounded-lg flex items-center justify-between gap-3 font-mono text-xs text-zinc-400 overflow-x-auto">
      {/* ── Left: Metrics ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        {/* On-chain burned $BATON */}
        <StatItem
          label="ON-CHAIN BURNED"
          loading={isBurnLoading}
          highlight
          value={
            <>
              {formatNumber(tokenStats?.totalBurned ?? 0)}{" "}
              <span className="text-zinc-500 font-normal">$BATON</span>
            </>
          }
        />

        <Divider />

        {/* Attention leader: highest-MC listed coin */}
        <StatItem
          label="ATTENTION LEADER"
          loading={isCoinsLoading}
          value={
            leader ? (
              <>
                <span className="text-amber-400">${leader.ticker}</span>
                <span className="text-zinc-400 font-normal ml-1">
                  ({formatCurrency(leader.marketCap)})
                </span>
              </>
            ) : (
              "—"
            )
          }
        />

        <Divider />

        {/* Active rooms */}
        <StatItem
          label="ACTIVE ROOMS"
          loading={isCoinsLoading}
          value={activeRooms}
        />

        <Divider />

        {/* Total 24h volume */}
        <StatItem
          label="24H VOLUME"
          loading={isCoinsLoading}
          value={formatCurrency(totalVolume24h)}
        />
      </div>

      {/* ── Right: CTA Button ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onOutbidClick}
        className="shrink-0 px-3 py-1.5 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 font-bold text-[11px] uppercase tracking-widest transition-all hover:border-amber-500/70 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)] active:scale-95"
      >
        [ OUTBID #1 SPOT ]
      </button>
    </div>
  );
}

export default HomeStatsBar;
