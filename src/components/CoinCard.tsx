"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Coin } from "@/types/coin";
import { getBurnTierInfo } from "@/lib/burn-levels";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CopyButton } from "@/components/CopyButton";
import { Flame, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

interface CoinCardProps {
  coin: Coin;
  onBurnClick?: (coin: Coin) => void;
}

export const CoinCard: React.FC<CoinCardProps> = React.memo(({ coin, onBurnClick }) => {
  const [imageError, setImageError] = useState(false);
  const isPositive = coin.change24h >= 0;
  const tierInfo = getBurnTierInfo(coin.totalBurnedBaton);
  const isDiamond = tierInfo.level === "diamond";

  // Generate SVG Polyline points for sparkline
  const sparklineData = coin.sparkline && coin.sparkline.length > 0
    ? coin.sparkline
    : [10, 15, 12, 20, 18, 25];

  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;

  const width = 240;
  const height = 40;
  const padding = 4;

  const points = sparklineData
    .map((val, index) => {
      const x = (index / (sparklineData.length - 1)) * width;
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const strokeColor = isPositive ? "#4ade80" : "#ff5c5c";

  return (
    <div
      className={`group relative rounded-2xl border bg-bg-card p-5 flex flex-col justify-between transition-all duration-200 hover:border-acid-dim hover:-translate-y-[3px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] content-auto ${
        isDiamond
          ? `border-acid/40 ${tierInfo.glowClass}`
          : "border-line"
      }`}
    >
      {/* 1. Top Section: Avatar, Name, Ticker, Level Badge */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* 40x40px Coin Avatar */}
            <div
              className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-archivo text-sm font-bold shrink-0 shadow-inner"
              style={{
                backgroundColor: `${coin.iconColor}18`,
                color: coin.iconColor,
                border: `1px solid ${coin.iconColor}40`,
              }}
            >
              {coin.imageUrl && !imageError ? (
                <Image
                  src={coin.imageUrl}
                  alt={coin.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <span>{coin.ticker.slice(0, 3)}</span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-archivo text-base text-text truncate group-hover:text-acid transition-colors">
                {coin.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-dim uppercase tracking-wider">
                  ${coin.ticker}
                </span>
                <CopyButton text={coin.mintAddress} label="CA" />
              </div>
            </div>
          </div>

          {/* Level Badge (Right Top) */}
          {tierInfo.level !== "none" && (
            <div
              className={`shrink-0 px-2 py-0.5 rounded-full border font-mono text-[10px] font-bold uppercase tracking-wider select-none ${tierInfo.badgeClass}`}
            >
              {tierInfo.badgeText}
            </div>
          )}
        </div>

        {/* 2. Middle Section: Minimal Sparkline Chart */}
        <div className="my-3 py-2 px-1 rounded-lg bg-bg-raised/50 border border-line/40">
          <div className="flex items-center justify-between text-[10px] font-mono text-text-faint px-1 mb-1">
            <span>Trend (7D)</span>
            <span className={isPositive ? "text-up font-bold" : "text-down font-bold"}>
              {isPositive ? "+" : ""}
              {coin.change24h.toFixed(2)}%
            </span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-10 overflow-visible"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>

        {/* 3. Bottom Section: Market Cap, 24h Change, Total Burned */}
        <div className="space-y-2 py-2 border-t border-line/60 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-faint text-[11px] uppercase">Market Cap</span>
            <span className="font-bold text-text font-mono-num">
              {formatCurrency(coin.marketCap)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-faint text-[11px] uppercase">24h Change</span>
            <div
              className={`font-semibold flex items-center gap-1 ${
                isPositive ? "text-up" : "text-down"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {coin.change24h.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-faint text-[11px] uppercase flex items-center gap-1 text-magenta">
              <Flame className="w-3 h-3" />
              <span>Burned $BATON</span>
            </span>
            <span className="font-bold text-acid font-mono-num">
              {formatNumber(coin.totalBurnedBaton)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons: pump.fun link + Solscan + DexScreener + Burn & Boost button */}
      <div className="pt-3 mt-2 border-t border-line/40 flex items-center gap-2">
        <a
          href={`https://pump.fun/coin/${coin.mintAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-bg-raised border border-line text-text-dim hover:text-text hover:border-text-dim transition-colors text-xs font-mono font-bold flex items-center gap-1"
          title="Buy on pump.fun"
        >
          <span className="text-[10px]">pump.fun</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href={`https://dexscreener.com/solana/${coin.mintAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-bg-raised border border-line text-text-dim hover:text-text hover:border-text-dim transition-colors"
          title="View on DexScreener"
        >
          <span className="text-[10px] font-mono font-bold">DEX</span>
        </a>

        <a
          href={`https://solscan.io/token/${coin.mintAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-bg-raised border border-line text-text-dim hover:text-text hover:border-text-dim transition-colors"
          title="View on Solscan"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          type="button"
          onClick={() => onBurnClick?.(coin)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-bg-raised border border-acid/40 text-acid hover:bg-acid hover:text-bg font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(212,255,63,0.1)] active:scale-95"
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>Burn</span>
        </button>
      </div>
    </div>
  );
});

CoinCard.displayName = "CoinCard";
