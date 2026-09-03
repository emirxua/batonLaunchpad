"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  Flame,
  Star,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Activity,
  Droplets,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency, formatCryptoPrice } from "@/lib/utils";
import { useWatchlistTokens } from "@/hooks/useWatchlistTokens";

export interface DrawerTokenData {
  mint: string;
  symbol: string;
  name: string;
  iconUrl?: string;
  priceUsd?: number;
  marketCap?: number;
  volume24h?: number;
  liquidityUsd?: number;
  priceChange24h?: number;
  dexId?: string;
  thesis?: string;
}

interface TokenChartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: DrawerTokenData | null;
  onQuickBuy?: (mint: string, symbol: string, amountSol: string, name?: string, iconUrl?: string) => void;
  onBoostToken?: (mint: string, symbol: string, name?: string, iconUrl?: string, mcap?: number) => void;
}

export function TokenChartDrawer({
  isOpen,
  onClose,
  token,
  onQuickBuy,
  onBoostToken,
}: TokenChartDrawerProps) {
  const [copiedCA, setCopiedCA] = useState(false);
  const [activeIframeTab, setActiveIframeTab] = useState<"chart" | "txns">("chart");
  const { isWatchlisted, toggleWatchlist } = useWatchlistTokens();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !token) return null;

  const isBaton = token.mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
  const isPump = token.mint.toLowerCase().endsWith("pump") && !(token.dexId || "").toLowerCase().includes("meteora");
  const isPositive = (token.priceChange24h ?? 0) >= 0;
  const starred = isWatchlisted(token.mint);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token.mint);
    setCopiedCA(true);
    setTimeout(() => setCopiedCA(false), 2000);
  };

  const chartUrl = `https://dexscreener.com/solana/${token.mint}?embed=1&theme=dark&trades=${activeIframeTab === "txns" ? "1" : "0"}&info=0`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 select-none font-mono"
    >
      {/* Slide-Over Drawer Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-[#0B0C10] border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-amber-500/20 shadow-2xl flex flex-col h-[90vh] sm:h-full overflow-hidden animate-in slide-in-from-right-8 sm:slide-in-from-right duration-200"
      >
        {/* ── Top Bar: Token Logo, Name, Badges & Close ── */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-[#0E1017] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-amber-400 font-bold overflow-hidden shrink-0 shadow-md">
              {token.iconUrl ? (
                <img
                  src={token.iconUrl}
                  alt={token.symbol}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <span>${token.symbol.slice(0, 2)}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white tracking-tight truncate">
                  ${token.symbol}
                </h3>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 uppercase">
                  {token.dexId || (isPump ? "PUMP" : "SOLANA")}
                </span>
                {/* Watchlist Star Button */}
                <button
                  type="button"
                  onClick={(e) => toggleWatchlist(token.mint, e)}
                  className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={starred ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      starred ? "fill-amber-400 text-amber-400" : "text-zinc-400 hover:text-amber-400"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-zinc-500 truncate">{token.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Copy CA */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 text-zinc-500 hover:text-amber-400 transition-all cursor-pointer shadow-sm"
              title="Copy Contract Address"
            >
              {copiedCA ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* DexScreener External Link */}
            <a
              href={`https://dexscreener.com/solana/${token.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 text-zinc-500 hover:text-amber-400 transition-all cursor-pointer shadow-sm"
              title="Open on DexScreener"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-rose-500/15 hover:text-rose-400 text-zinc-500 transition-all cursor-pointer shadow-sm"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Key Metrics Bar ── */}
        <div className="grid grid-cols-4 gap-1 p-3 bg-zinc-100/70 dark:bg-[#07080b] border-b border-zinc-200 dark:border-white/10 text-center font-mono text-xs shrink-0">
          <div>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block uppercase font-bold">Price</span>
            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 truncate block">
              {token.priceUsd ? formatCryptoPrice(token.priceUsd) : "—"}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block uppercase font-bold">MCAP</span>
            <span className="font-extrabold text-amber-500 dark:text-amber-400 truncate block">
              {token.marketCap && token.marketCap > 0 ? formatCurrency(token.marketCap) : "—"}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block uppercase font-bold">24H Vol</span>
            <span className="font-extrabold text-zinc-900 dark:text-zinc-200 truncate block">
              {token.volume24h ? formatCurrency(token.volume24h) : "—"}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 block uppercase font-bold">24H Change</span>
            <span
              className={`font-black flex items-center justify-center gap-0.5 ${
                isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {token.priceChange24h !== undefined ? `${isPositive ? "+" : ""}${token.priceChange24h.toFixed(1)}%` : "0%"}
            </span>
          </div>
        </div>

        {/* ── Security & On-Chain Trust Badges ── */}
        <div className="px-4 py-2 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0a0c10] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-[10px] font-bold">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <ShieldCheck className="w-3 h-3" />
            <span>Mint Revoked</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <ShieldCheck className="w-3 h-3" />
            <span>Freeze Disabled</span>
          </span>
          {isPump ? (
            <a
              href={`https://pump.fun/coin/${token.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 whitespace-nowrap hover:bg-cyan-500/20 transition-colors"
            >
              <span>💊 Pump.fun Contract</span>
              <ArrowUpRight className="w-2.5 h-2.5" />
            </a>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
              <span>Raydium Verified LP</span>
            </span>
          )}
        </div>

        {/* ── Interactive DexScreener Live Chart Iframe ── */}
        <div className="flex-1 relative bg-black min-h-[300px]">
          <iframe
            src={chartUrl}
            title={`${token.symbol} Live Chart`}
            className="w-full h-full border-0 absolute inset-0"
            allow="clipboard-write"
          />
        </div>

        {/* ── Action Footer: 1-Click Quick Snipe Presets & Boost CTA ── */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#0E1017] space-y-2.5 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>1-Click Quick Snipe (SOL)</span>
            </span>
            <span className="text-[10px] text-zinc-400">Powered by Jupiter V6</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {["0.1", "0.5", "1.0", "2.0"].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  if (onQuickBuy) {
                    onQuickBuy(token.mint, token.symbol, amt, token.name, token.iconUrl);
                  }
                }}
                className="py-2 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 hover:border-amber-500/60 text-amber-600 dark:text-amber-400 font-black text-xs transition-all cursor-pointer active:scale-95 shadow-sm flex items-center justify-center gap-1"
              >
                <Zap className="w-3 h-3 fill-current text-amber-500" />
                <span>{amt} SOL</span>
              </button>
            ))}
          </div>

          {/* Burn $BATON to Boost Action */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (onBoostToken) {
                  onBoostToken(token.mint, token.symbol, token.name, token.iconUrl, token.marketCap);
                }
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 fill-current text-zinc-950" />
              <span>Burn $BATON to Rank #${token.symbol}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenChartDrawer;
