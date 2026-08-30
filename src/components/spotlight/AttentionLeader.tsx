"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useCoinsData } from "@/hooks/useCoinsData";
import {
  Crown,
  Flame,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ArrowRight,
  Zap,
} from "lucide-react";

export function AttentionLeader({ onOutbidClick }: { onOutbidClick?: () => void }) {
  const [copied, setCopied] = useState(false);
  const { coins, isLoading } = useCoinsData();
  const token = coins[0];

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token.mintAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!token) {
    return (
      <div className="w-full bg-white dark:bg-zinc-950 border border-amber-500/20 rounded-3xl p-6 shadow-2xl font-mono">
        <div className="flex items-center gap-2 text-zinc-500 text-xs animate-pulse">
          <Crown className="w-4 h-4 text-amber-500" />
          <span>Fetching live #1 King of the Hill Attention Leader from Solana DexScreener…</span>
        </div>
      </div>
    );
  }

  const isPositive = token.change24h >= 0;

  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden font-mono select-none">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400 fill-current" />
          <span className="text-xs font-black text-amber-500 dark:text-amber-400 uppercase tracking-wider">
            KING OF THE HILL (#1 ATTENTION LEADER)
          </span>
        </div>

        <span className="text-[10px] text-zinc-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase">
          🔥 {formatNumber(token.totalBurnedBaton)} $BATON Burned
        </span>
      </div>

      {/* Main Info */}
      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 text-amber-400 font-bold">
            {token.imageUrl ? (
              <img src={token.imageUrl} alt={token.name} className="w-full h-full object-cover" />
            ) : (
              <span>${token.ticker.slice(0, 3)}</span>
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-zinc-950 dark:text-white">
              {token.name} (${token.ticker})
            </h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
              <span>{token.mintAddress.slice(0, 6)}…{token.mintAddress.slice(-6)}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-amber-400 transition-colors p-0.5 cursor-pointer"
                title="Copy CA"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`https://solscan.io/token/${token.mintAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors p-0.5"
                title="View on Solscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-sm font-black text-zinc-950 dark:text-white block">
              {token.priceUsd
                ? token.priceUsd < 0.001
                  ? `$${token.priceUsd.toFixed(6)}`
                  : `$${token.priceUsd.toFixed(4)}`
                : "$0.00"}
            </span>
            <span className={`text-xs font-bold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
              {isPositive ? "+" : ""}{token.change24h.toFixed(1)}% (24h)
            </span>
          </div>

          <button
            type="button"
            onClick={onOutbidClick}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>Outbid Spotlight</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttentionLeader;
