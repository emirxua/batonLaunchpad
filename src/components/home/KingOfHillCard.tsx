"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Coin } from "@/types/coin";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Copy, Check, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

interface KingOfHillCardProps {
  coin: Coin | null;
  isLoading?: boolean;
  onOutbidClick?: (coin: Coin) => void;
}

export function KingOfHillCard({
  coin,
  isLoading = false,
  onOutbidClick,
}: KingOfHillCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!coin?.mintAddress) return;
    navigator.clipboard.writeText(coin.mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !coin) {
    return (
      <div className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-amber-500/30 rounded-xl p-5 relative overflow-hidden animate-pulse">
        <div className="h-4 w-48 bg-zinc-800 rounded mb-4" />
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-zinc-800 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 bg-zinc-800 rounded" />
            <div className="h-3.5 w-44 bg-zinc-800/60 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-zinc-800/40 rounded-lg p-2" />
          ))}
        </div>
        <div className="flex gap-3">
          <div className="h-9 flex-1 bg-zinc-800 rounded-lg" />
          <div className="h-9 flex-1 bg-zinc-800 rounded-lg" />
        </div>
      </div>
    );
  }

  const isPositive = (coin.change24h || 0) >= 0;
  const shortMint = `${coin.mintAddress.slice(0, 4)}...${coin.mintAddress.slice(-4)}`;

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-amber-500/30 rounded-xl p-5 relative overflow-hidden shadow-2xl group transition-all hover:border-amber-500/50">
      {/* Ambient glow in corner */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-100 dark:border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-amber-400 font-mono text-xs font-bold tracking-wider uppercase">
            RANK #1 ATTENTION LEADER
          </span>
        </div>
        {coin.category && (
          <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-100 dark:border-white/5 text-zinc-500 dark:text-zinc-400 font-mono text-[10px] uppercase">
            {coin.category}
          </span>
        )}
      </div>

      {/* Main Info Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Logo / Image */}
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800/90 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md">
            {coin.imageUrl ? (
              <Image
                src={coin.imageUrl}
                alt={coin.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <span className="font-mono text-base font-bold text-amber-400">
                {coin.ticker.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name, Symbol, Copy CA */}
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-archivo text-xl font-black text-zinc-950 dark:text-white tracking-tight truncate">
                {coin.name}
              </h2>
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                ${coin.ticker}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              <span className="text-zinc-500 font-normal">CA:</span>
              <span className="text-zinc-700 dark:text-zinc-300">{shortMint}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-amber-400 transition-colors"
                title="Copy Contract Address"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
              <a
                href={`https://dexscreener.com/solana/${coin.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-white transition-colors"
                title="View on DexScreener"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Total Burned Badge */}
        <div className="sm:text-right bg-white dark:bg-zinc-950/60 sm:bg-transparent border border-zinc-100 dark:border-white/5 sm:border-0 rounded-lg p-2.5 sm:p-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            TOTAL BURN SCORE
          </div>
          <div className="font-mono text-lg sm:text-xl font-bold text-amber-400 tracking-tight">
            {formatNumber(coin.totalBurnedBaton || 0)}{" "}
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">$BATON</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-white dark:bg-zinc-950/70 border border-zinc-100 dark:border-white/5 font-mono mb-5 relative z-10">
        <div>
          <div className="text-[10px] uppercase text-zinc-500">Price</div>
          <div className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white">
            ${coin.priceUsd ? (coin.priceUsd < 0.01 ? coin.priceUsd.toFixed(6) : coin.priceUsd.toFixed(4)) : "0.00"}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase text-zinc-500">24h Change</div>
          <div
            className={`text-xs sm:text-sm font-bold flex items-center gap-0.5 ${
              isPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {(coin.change24h || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase text-zinc-500">Market Cap</div>
          <div className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {formatCurrency(coin.marketCap || 0)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 font-mono text-xs font-bold">
        <Link
          href={`/terminal?outputMint=${coin.mintAddress}&outputSymbol=${coin.ticker}`}
          className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-200 dark:border-white/10 hover:border-white/20 text-zinc-800 dark:text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition-all text-center tracking-wider"
        >
          <span>[ TRADE ON TERMINAL ]</span>
        </Link>

        <button
          type="button"
          onClick={() => onOutbidClick?.(coin)}
          className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer tracking-wider uppercase"
        >
          <span>[ OUTBID THIS SPOT ]</span>
        </button>
      </div>
    </div>
  );
}

export default KingOfHillCard;
