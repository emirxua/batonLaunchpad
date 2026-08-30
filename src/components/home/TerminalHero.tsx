"use client";

import React from "react";
import useSWR from "swr";
import { Zap, Flame, Radio, ArrowRight, Activity, Terminal, PlusCircle } from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";

interface TerminalHeroProps {
  onExploreCallouts?: () => void;
  onPostCallout?: () => void;
  onQuickSwapClick?: () => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function TerminalHero({
  onExploreCallouts,
  onPostCallout,
  onQuickSwapClick,
}: TerminalHeroProps) {
  const { data: dirData } = useSWR("/api/directory", fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  const { data: tokenStatsData } = useSWR("/api/token-stats", fetcher, {
    refreshInterval: 20_000,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  const { data: calloutData } = useSWR("/api/callouts", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  });

  const totalBurned = tokenStatsData?.totalBurned ?? dirData?.totalBurned ?? 0;
  const totalVolume24h = dirData?.marketOverview?.totalVolume24h ?? 0;
  const activeCalloutsCount = calloutData?.count ?? calloutData?.callouts?.length ?? 0;

  return (
    <section className="relative w-full rounded-xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-[#0d0e12] to-zinc-950 px-3 py-2.5 sm:px-4 sm:py-3 overflow-hidden shadow-lg font-mono select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* ── Left Side: Ultra-Minimal Title & Actions ─────────────────── */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5 w-full lg:w-auto">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
            <Terminal className="w-3 h-3 text-amber-400" />
            <span>TERMINAL</span>
          </div>

          <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight text-center sm:text-left">
            ON-CHAIN ALPHA &amp;{" "}
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
              INSTANT DEX SWAP
            </span>
          </h1>

          {/* Inline Action Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href="/callouts"
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-all uppercase tracking-wider active:scale-95"
            >
              <Radio className="w-3 h-3 text-zinc-950 animate-pulse" />
              <span>Live Callouts</span>
              <ArrowRight className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={onPostCallout}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 transition-all uppercase tracking-wider cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Post</span>
            </button>

            <button
              type="button"
              onClick={onQuickSwapClick}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 font-bold text-[11px] flex items-center gap-1 transition-all uppercase tracking-wider cursor-pointer active:scale-95"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Swap</span>
            </button>
          </div>
        </div>

        {/* ── Right Side: Ultra-Compact Stat Pills (Responsive Wrap) ──── */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 shrink-0">
          <div className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/10 flex items-center gap-1.5 text-[11px] shadow-sm">
            <Activity className="w-3 h-3 text-amber-400" />
            <span className="text-zinc-500 uppercase font-bold text-[9px]">24H VOL</span>
            <span className="font-extrabold text-white">
              {totalVolume24h > 0 ? formatCurrency(totalVolume24h) : "$0.00"}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/10 flex items-center gap-1.5 text-[11px] shadow-sm">
            <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
            <span className="text-zinc-500 uppercase font-bold text-[9px]">SIGNALS</span>
            <span className="font-extrabold text-white">
              {activeCalloutsCount}
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/10 flex items-center gap-1.5 text-[11px] shadow-sm">
            <Flame className="w-3 h-3 fill-current text-orange-500" />
            <span className="text-zinc-500 uppercase font-bold text-[9px]">BURNED</span>
            <span className="font-extrabold text-amber-400">
              {totalBurned > 0
                ? totalBurned >= 1_000_000
                  ? `${(totalBurned / 1_000_000).toFixed(2)}M`
                  : formatNumber(totalBurned)
                : "0"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TerminalHero;
