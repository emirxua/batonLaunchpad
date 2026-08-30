"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Coin } from "@/types/coin";
import { useCoinsData } from "@/hooks/useCoinsData";
import { useTokenStats } from "@/hooks/useTokenStats";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Crown,
  Flame,
  ArrowRight,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface HeroSpotlightProps {
  onBoostCoin?: (coin: Coin) => void;
  className?: string;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  onBoostCoin,
  className = "",
}) => {
  const { coins, isLoading } = useCoinsData();
  const [copiedCA, setCopiedCA] = useState<boolean>(false);

  // 1. On-chain burn data from Solana RPC (15s refresh)
  const { totalBurned, burnPercentage, isLoading: burnLoading } = useTokenStats(15_000);

  const top1Coin: Coin | null = coins[0] || null;

  if (!top1Coin) {
    return (
      <div className={`relative w-full rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-b from-[#14161D] via-[#0E1015] to-[#08090C] border border-amber-500/30 ring-1 ring-amber-400/40 shadow-xl font-mono ${className}`}>
        <div className="flex items-center gap-2 text-xs text-zinc-500 animate-pulse">
          <Crown className="w-4 h-4 text-amber-400" />
          <span>Loading #1 Attention Leader spotlight…</span>
        </div>
      </div>
    );
  }

  const displayName = top1Coin.name;
  const displaySymbol = top1Coin.ticker;
  const displayIcon = top1Coin.imageUrl;
  const displayPrice = top1Coin.priceUsd ?? 0;
  const displayMcap = top1Coin.marketCap;
  const displayChange24h = top1Coin.change24h;
  const isPositive = displayChange24h >= 0;

  const handleCopy = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedCA(true);
    setTimeout(() => setCopiedCA(false), 2000);
  };

  return (
    <div
      className={`relative w-full rounded-3xl p-6 sm:p-8 overflow-hidden transition-all bg-gradient-to-b from-[#14161D] via-[#0E1015] to-[#08090C] border border-amber-500/30 ring-1 ring-amber-400/40 shadow-xl ${className}`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Leader Banner & Token Info */}
        <div className="space-y-4 max-w-xl">
          {/* Attention Leader Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-black tracking-wide uppercase shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse">
            <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>👑 CURRENT #1 ATTENTION LEADER</span>
          </div>

          {/* Token Title & Logo */}
          <div className="flex items-center gap-3.5">
            {displayIcon ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-400/40 bg-zinc-50 dark:bg-zinc-900 shrink-0 shadow-lg">
                <Image
                  src={displayIcon}
                  alt={displaySymbol}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center text-xl font-black text-amber-300 shrink-0 uppercase shadow-lg">
                {displaySymbol.slice(0, 2)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-archivo text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white uppercase tracking-tight truncate">
                  ${displaySymbol}
                </h2>
                {displayChange24h !== 0 && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                      isPositive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}
                      {displayChange24h.toFixed(2)}%
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-mono line-clamp-1 mt-0.5">
                {displayName}
              </p>
            </div>
          </div>

          {/* CA Row */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <span className="text-zinc-500 uppercase">CA:</span>
            <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[200px] sm:max-w-xs">
              {top1Coin.mintAddress}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(top1Coin.mintAddress)}
              className="hover:text-amber-400 transition-colors p-0.5"
              title="Copy CA"
            >
              {copiedCA ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Stats & Action Buttons */}
        <div className="flex flex-col gap-4 lg:items-end w-full lg:w-auto">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-3 rounded-2xl bg-white dark:bg-black/50 border border-zinc-200 dark:border-white/10 font-mono text-center w-full lg:w-[380px]">
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 space-y-0.5">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider">
                Price
              </div>
              <div className="font-bold text-zinc-950 dark:text-white text-xs sm:text-sm truncate">
                ${displayPrice > 0 ? (displayPrice >= 1 ? displayPrice.toFixed(2) : displayPrice.toFixed(6)) : "—"}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-white/5 space-y-0.5">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider">
                Mcap
              </div>
              <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm truncate">
                {displayMcap > 0 ? formatCurrency(displayMcap) : "—"}
              </div>
            </div>

            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-0.5">
              <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-2.5 h-2.5" />
                Burned (On-chain)
              </div>
              {burnLoading && totalBurned === 0 ? (
                <div className="h-4 w-16 bg-amber-500/20 rounded animate-pulse mx-auto" />
              ) : (
                <div className="font-black text-amber-300 text-xs sm:text-sm truncate" title={`${burnPercentage.toFixed(4)}% of supply`}>
                  {totalBurned > 0
                    ? `${formatNumber(totalBurned)} $BATON`
                    : top1Coin.totalBurnedBaton > 0
                    ? `${formatNumber(top1Coin.totalBurnedBaton)} $BATON`
                    : "0 $BATON"}
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href={`/terminal?token=${top1Coin.mintAddress}`}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-archivo font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <span>Trade Now on Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => onBoostCoin?.(top1Coin)}
              className="px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-zinc-950 dark:text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-orange-400 fill-current" />
              <span>Boost / Outbid</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
