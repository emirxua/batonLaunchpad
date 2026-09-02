"use client";

import React from "react";
import useSWR from "swr";
import { Zap, Flame, Radio, Activity, Terminal } from "lucide-react";
import { formatNumber, formatCurrency, formatCryptoPrice } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TerminalHeroProps {
  onExploreCallouts?: () => void;
  onQuickSwapClick?: () => void;
}

export function TerminalHero({ onQuickSwapClick }: TerminalHeroProps) {
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

  const { data: batonStats } = useSWR("/api/token-stats", fetcher, {
    refreshInterval: 8_000,
    revalidateOnFocus: true,
    dedupingInterval: 4_000,
  });

  const [copiedCA, setCopiedCA] = React.useState(false);

  const totalBurned = burnsData?.totalBurnedAmount ?? batonStats?.totalBurned ?? 0;
  const totalVolume24h = dirData?.marketOverview?.totalVolume24h ?? 0;
  const activeCalloutsCount = calloutData?.count ?? calloutData?.callouts?.length ?? 0;

  const batonPrice = batonStats?.priceUsd ?? 0;
  const batonChange24h = batonStats?.priceChange24h ?? 0;
  const batonMcap = batonStats?.marketCap ?? 0;
  const isPricePositive = batonChange24h >= 0;
  const batonCA = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

  const handleCopyCA = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(batonCA);
    setCopiedCA(true);
    setTimeout(() => setCopiedCA(false), 2000);
  };

  return (
    <div className="w-full space-y-2 font-mono select-none">
      {/* ── Top Bar: $BATON Live Price & Contract Address Strip ───────────── */}
      <div className="w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#0c0d12]/90 backdrop-blur-md text-xs shadow-sm hover:border-amber-500/30 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Left: Token Badge & Live Price / 24h Change */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={`https://pump.fun/coin/${batonCA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
              title="View $BATON profile on Pump.fun"
            >
              <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden p-0.5 shadow-sm">
                <img
                  src={batonStats?.iconUrl || "/images/baton-logo.png"}
                  alt="BATON"
                  className="w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/baton-logo.png";
                  }}
                />
              </div>
              <span className="font-black text-sm tracking-wide text-zinc-950 dark:text-white">$BATON</span>
            </a>

            {/* Real-time Dex Price */}
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-zinc-900 dark:text-zinc-100 font-mono">
                {formatCryptoPrice(batonPrice)}
              </span>

              {/* 24h Change Badge */}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5 border ${
                  isPricePositive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                }`}
              >
                <span>{isPricePositive ? `+${batonChange24h.toFixed(1)}%` : `${batonChange24h.toFixed(1)}%`}</span>
              </span>

              {/* Market Cap */}
              <span className="text-[10px] text-zinc-500 hidden md:inline">
                MCAP: <strong className="text-zinc-800 dark:text-zinc-200 font-bold">${formatNumber(batonMcap)}</strong>
              </span>
            </div>
          </div>

          {/* Right: CA Copy, Links & Quick Buy */}
          <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-end text-[11px]">
            {/* CA with Copy */}
            <div className="flex items-center gap-1 bg-zinc-100/90 dark:bg-zinc-900/80 px-2 py-1 rounded-xl border border-zinc-200/80 dark:border-white/5">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">CA:</span>
              <span className="font-mono text-[10px] text-zinc-700 dark:text-zinc-300">
                2vdc…pump
              </span>
              <button
                type="button"
                onClick={handleCopyCA}
                className="p-0.5 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                title="Copy $BATON CA"
              >
                {copiedCA ? <span className="text-emerald-500 text-[10px] font-bold">✓</span> : <span className="text-[10px]">📋</span>}
              </button>
            </div>

            {/* DexScreener Link */}
            <a
              href={`https://dexscreener.com/solana/${batonCA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-[10px] flex items-center gap-0.5 transition-all shadow-sm cursor-pointer"
              title="View $BATON Chart on DexScreener"
            >
              <span>🦅 Dex</span>
            </a>

            {/* Pump.fun Link */}
            <a
              href={`https://pump.fun/coin/${batonCA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-0.5 transition-all shadow-sm cursor-pointer"
              title="View & Trade $BATON on Pump.fun"
            >
              <span>💊 Pump</span>
            </a>

            {/* Quick Swap CTA */}
            {onQuickSwapClick && (
              <button
                type="button"
                onClick={onQuickSwapClick}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Instant Buy $BATON"
              >
                <Zap className="w-2.5 h-2.5 fill-current" />
                <span>Buy $BATON</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Sub Bar: Global Network Stats ─────────────────────────────────── */}
      <div className="w-full px-2.5 sm:px-4 py-1.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/80 dark:bg-[#0c0d12]/80 backdrop-blur-md text-xs shadow-sm">
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
    </div>
  );
}

export default TerminalHero;
