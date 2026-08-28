"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Flame, ExternalLink, Sparkles, TrendingUp, Copy, Check } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

export interface FeaturedCardProps {
  name?: string;
  ticker?: string;
  description?: string;
  mintAddress?: string;
  imageUrl?: string;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  totalBurnedBaton?: number;
  isLoading?: boolean;
  onBurnClick?: () => void;
}

export const FeaturedCard: React.FC<FeaturedCardProps> = React.memo(({
  name = "Baton",
  ticker = "$BATON",
  description = "The premier community-driven mascot token and deflationary burn engine on Solana.",
  mintAddress = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
  imageUrl = "https://cdn.dexscreener.com/cms/images/B_1EShunz2lCb0jz?width=800&height=800&quality=95&format=auto",
  marketCap = 12_435,
  volume24h = 653,
  change24h = 16.09,
  totalBurnedBaton = 0,
  isLoading = false,
  onBurnClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);
  const isPositive = (change24h ?? 0) >= 0;

  const handleCopyCA = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-3xl border border-magenta-dim bg-bg-card bg-gradient-to-r from-magenta/10 via-bg-card to-bg-card shadow-[0_0_35px_rgba(255,61,122,0.15)] overflow-hidden transition-all duration-300 hover:shadow-[0_0_45px_rgba(255,61,122,0.25)] content-auto">
      {/* Top-Left Badge */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-magenta text-[#0a0b0d] font-mono text-[10px] font-black uppercase tracking-wider rounded-br-2xl shadow-md select-none">
        <Sparkles className="w-3 h-3 fill-current" />
        <span>FEATURED SPOTLIGHT</span>
      </div>

      {/* Main Responsive Grid Container */}
      <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-8">
        {/* 1. Left Section: 80x80 Avatar + Header + Copy CA + Description */}
        <div className="lg:col-span-5 flex flex-col sm:flex-row items-start gap-4 sm:gap-5 min-w-0">
          {/* 80x80px Relative Avatar Box with Unclipped Flame Badge */}
          <div className="relative w-20 h-20 shrink-0">
            <div className="w-full h-full rounded-2xl overflow-hidden border border-magenta/50 bg-gradient-to-br from-magenta/25 to-magenta-dim/40 flex items-center justify-center shadow-[0_0_25px_rgba(255,61,122,0.3)]">
              {imageUrl && !imageError ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-2xl"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <span className="font-archivo text-4xl font-black text-magenta tracking-tight select-none">
                  {ticker.replace("$", "").slice(0, 1) || "B"}
                </span>
              )}
            </div>

            {/* Unclipped Flame Badge */}
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-magenta text-[#0a0b0d] flex items-center justify-center border-2 border-bg shadow-md z-10">
              <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
            </div>
          </div>

          {/* Title, Badges, Copy CA, and Description */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-archivo text-2xl sm:text-3xl text-text tracking-tight uppercase">
                {name}
              </h3>

              <span className="font-mono text-xs sm:text-sm font-bold text-magenta bg-magenta/10 border border-magenta/30 px-2 py-0.5 rounded-md uppercase">
                {ticker}
              </span>

              {/* Functional Copy CA Button */}
              <button
                type="button"
                onClick={handleCopyCA}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold transition-all active:scale-95 select-none ${
                  copied
                    ? "bg-up/15 border-up/50 text-up shadow-[0_0_12px_rgba(74,222,128,0.2)]"
                    : "bg-bg-raised border-line text-text-dim hover:text-acid hover:border-acid/40"
                }`}
                title="Click to copy Mint Address (CA)"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-up stroke-[2.5]" />
                    <span className="text-[11px]">✓ Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="text-[11px]">Copy CA</span>
                  </>
                )}
              </button>

              {/* 24h Change Badge */}
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                  isPositive
                    ? "text-up bg-up/10 border-up/20"
                    : "text-down bg-down/10 border-down/20"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>
                  {isPositive ? "+" : ""}
                  {(change24h ?? 0).toFixed(1)}%
                </span>
              </span>
            </div>

            {/* Description */}
            <p className="font-space text-[13px] text-text-dim leading-relaxed max-w-xl">
              {description}
            </p>
          </div>
        </div>

        {/* 2. Middle Section: 3 Metric Columns with Clear Formatting & No Overflow */}
        <div className="lg:col-span-4 p-3.5 sm:p-4 rounded-2xl bg-bg-raised/60 lg:bg-transparent lg:p-0 border border-line/60 lg:border-y-0 lg:border-x lg:border-line/70 lg:px-6 grid grid-cols-3 gap-3 font-mono">
          {/* Market Cap */}
          <div className="space-y-1">
            <div className="text-[10px] sm:text-[11px] text-text-faint uppercase tracking-wider font-semibold">
              Market Cap
            </div>
            {isLoading ? (
              <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <div className="text-sm sm:text-base lg:text-lg font-bold text-text font-mono-num">
                {formatCurrency(marketCap)}
              </div>
            )}
          </div>

          {/* 24h Volume */}
          <div className="space-y-1">
            <div className="text-[10px] sm:text-[11px] text-text-faint uppercase tracking-wider font-semibold">
              24h Volume
            </div>
            {isLoading ? (
              <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            ) : (
              <div className="text-sm sm:text-base lg:text-lg font-bold text-text font-mono-num">
                {formatCurrency(volume24h)}
              </div>
            )}
          </div>

          {/* Total Burned */}
          <div className="space-y-1">
            <div className="text-[10px] sm:text-[11px] text-text-faint uppercase tracking-wider font-semibold flex items-center gap-1">
              <Flame className="w-3 h-3 text-acid shrink-0" />
              <span>Burned Total</span>
            </div>
            <div className="space-y-0.5">
              {isLoading ? (
                <div className="h-6 w-14 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              ) : (
                <div className="text-sm sm:text-base lg:text-lg font-black text-acid font-mono-num">
                  {formatNumber(totalBurnedBaton)}
                </div>
              )}
              <div className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
                $BATON
              </div>
            </div>
          </div>
        </div>

        {/* 3. Right Section: Action Buttons */}
        <div className="lg:col-span-3 flex flex-col gap-2.5 w-full">
          <a
            href={`https://pump.fun/coin/${mintAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-magenta text-[#0a0b0d] font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(255,61,122,0.35)] hover:-translate-y-0.5 hover:bg-[#ff528c] active:translate-y-0 transition-all duration-200"
          >
            <span>BUY ON PUMP.FUN</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBurnClick}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-bg-raised text-white dark:text-acid border border-zinc-900 dark:border-acid/40 hover:bg-emerald-600 dark:hover:bg-acid dark:hover:text-bg font-mono text-xs font-bold uppercase tracking-wider active:scale-95 transition-all duration-200 shadow-md shadow-zinc-900/10 dark:shadow-[0_0_12px_rgba(212,255,63,0.1)]"
            >
              <Flame className="w-3.5 h-3.5 fill-current text-rose-400 dark:text-acid" />
              <span>BURN &amp; BOOST</span>
            </button>

            <a
              href={`https://solscan.io/token/${mintAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white dark:bg-bg-raised border border-zinc-200/80 dark:border-line text-zinc-600 dark:text-text-dim font-mono text-xs font-bold hover:text-zinc-900 dark:hover:text-text hover:border-zinc-300 dark:hover:border-text-dim transition-colors shadow-sm"
              title="View on Solscan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

FeaturedCard.displayName = "FeaturedCard";
