"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MidasMarketBar } from "@/components/market/MidasMarketBar";
import { TrendingTable } from "@/components/terminal/TrendingTable";
import { JupiterSwapWidget } from "@/components/terminal/JupiterSwapWidget";
import { BurnModal } from "@/components/BurnModal";
import { DexTrendingToken } from "@/lib/types/terminal";
import { Coin } from "@/types/coin";
import { formatCurrency } from "@/lib/utils";
import {
  Flame,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";

const DEFAULT_BATON_MINT =
  process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS ||
  "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump";

const lookupFetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TerminalPage() {
  // 1. Unified Selected Token State
  const [selectedToken, setSelectedToken] = useState<{
    mint: string;
    symbol: string;
  }>({
    mint: DEFAULT_BATON_MINT,
    symbol: "BATON",
  });

  const [selectedTokenMeta, setSelectedTokenMeta] =
    useState<DexTrendingToken | null>(null);
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  // Boost modal state
  const [boostCoin, setBoostCoin] = useState<Coin | null>(null);

  // Sync with URL query parameter ?token= if present on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("token");
      if (tokenParam) {
        setSelectedToken({
          mint: tokenParam,
          symbol: tokenParam.slice(0, 6).toUpperCase(),
        });
      }
    }
  }, []);

  // Query detailed token lookup for the selected mint
  const { data: lookupData } = useSWR(
    selectedToken.mint
      ? `/api/token-lookup?mint=${encodeURIComponent(selectedToken.mint)}`
      : null,
    lookupFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000,
      errorRetryCount: 2,
      errorRetryInterval: 10_000,
    }
  );

  const displayToken = {
    name:
      selectedTokenMeta?.name ||
      lookupData?.name ||
      (selectedToken.symbol === "BATON"
        ? "Baton Corporation Ltd"
        : selectedToken.symbol),
    symbol:
      selectedTokenMeta?.symbol || lookupData?.symbol || selectedToken.symbol,
    mint: selectedToken.mint,
    iconUrl: selectedTokenMeta?.iconUrl || lookupData?.iconUrl || null,
    priceUsd: selectedTokenMeta?.priceUsd ?? lookupData?.priceUsd ?? 0,
    marketCap: selectedTokenMeta?.marketCap ?? lookupData?.marketCap ?? 0,
    volume24h: selectedTokenMeta?.volume24h ?? lookupData?.volume24h ?? 0,
    priceChange24h:
      selectedTokenMeta?.priceChange24h ?? lookupData?.priceChange24h ?? 0,
    pairAddress:
      selectedTokenMeta?.pairAddress || lookupData?.pairAddress || null,
  };

  const isPositive = displayToken.priceChange24h >= 0;

  const handleCopyCA = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const handleOpenBoostModal = () => {
    setBoostCoin({
      id: `token-${displayToken.mint}`,
      name: displayToken.name,
      ticker: displayToken.symbol,
      mintAddress: displayToken.mint,
      imageUrl: displayToken.iconUrl || undefined,
      iconColor: "#f97316",
      marketCap: displayToken.marketCap,
      volume24h: displayToken.volume24h,
      change24h: displayToken.priceChange24h,
      sparkline: [],
      totalBurnedBaton: 0,
      burnLevel: "none",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07080A] text-zinc-100 selection:bg-orange-500 selection:text-white font-space">
      {/* 1. Global Navigation Bar */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ── Page Title Header ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                <Activity className="w-4 h-4" />
              </div>
              <h1 className="font-archivo text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
                OUTBID TERMINAL
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-bold">
                LIVE
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400">
              Spot Market Pulse, Trending Solana Movers, and Direct Jupiter DEX Routing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-xs font-mono font-bold transition-colors"
            >
              ← Directory
            </Link>
            <Link
              href="/callouts"
              className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Flame className="w-3.5 h-3.5" />
              Live Callouts
            </Link>
          </div>
        </div>

        {/* ── 2. Top Market Bar (SOL, BTC, ETH, BNB) ───────────────────── */}
        <section>
          <MidasMarketBar />
        </section>

        {/* ── 3. Main 2-Column Responsive Grid ─────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Trending Tokens Table (8 cols on lg) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-xs text-zinc-400 font-bold tracking-wider uppercase">
                TRENDING SOLANA MOVERS
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Click any row to swap or inspect
              </span>
            </div>

            {/* 2. TrendingTable Props with dynamic onSelectToken and onTradeToken */}
            <TrendingTable
              selectedMint={selectedToken.mint}
              onSelectToken={(mint, symbol) => {
                setSelectedToken({ mint, symbol });
              }}
              onTradeToken={(token) => {
                setSelectedToken({ mint: token.mint, symbol: token.symbol });
                setSelectedTokenMeta(token);
              }}
            />
          </div>

          {/* Right Column: Swap Widget & Selected Token Künye (4 cols on lg) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            {/* Selected Token Mini Künyesi */}
            <div className="p-4 rounded-2xl bg-[#0D0E12] border border-white/10 space-y-3 font-mono shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {displayToken.iconUrl ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                      <Image
                        src={displayToken.iconUrl}
                        alt={displayToken.symbol}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-sm font-bold text-orange-400 shrink-0 uppercase">
                      {displayToken.symbol.slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-archivo font-black text-base text-white truncate">
                        ${displayToken.symbol}
                      </span>
                      {displayToken.priceChange24h !== 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5 ${
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-2.5 h-2.5" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5" />
                          )}
                          {isPositive ? "+" : ""}
                          {displayToken.priceChange24h.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {displayToken.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenBoostModal}
                  className="px-2.5 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 hover:text-orange-200 text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.15)]"
                >
                  <Flame className="w-3.5 h-3.5 fill-current text-orange-400" />
                  <span>Boost</span>
                </button>
              </div>

              {/* Stats 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-zinc-950/80 border border-white/5 space-y-0.5">
                  <div className="text-[9px] text-zinc-500 uppercase">Price</div>
                  <div className="font-bold text-white truncate">
                    {displayToken.priceUsd > 0
                      ? displayToken.priceUsd >= 1
                        ? `$${displayToken.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                        : displayToken.priceUsd < 0.000001
                        ? `$${displayToken.priceUsd.toFixed(8)}`
                        : displayToken.priceUsd < 0.001
                        ? `$${displayToken.priceUsd.toFixed(6)}`
                        : `$${displayToken.priceUsd.toFixed(4)}`
                      : "—"}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-zinc-950/80 border border-white/5 space-y-0.5">
                  <div className="text-[9px] text-zinc-500 uppercase">Market Cap</div>
                  <div className="font-bold text-zinc-200 truncate">
                    {displayToken.marketCap > 0 ? formatCurrency(displayToken.marketCap) : "—"}
                  </div>
                </div>
              </div>

              {/* CA Row with copy & explorer links */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 text-[10px] text-zinc-400">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-zinc-600 uppercase">CA:</span>
                  <span className="font-mono text-zinc-300 truncate">
                    {displayToken.mint}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCA(displayToken.mint)}
                    className="hover:text-orange-400 transition-colors p-0.5 shrink-0"
                    title="Copy CA"
                  >
                    {copiedMint === displayToken.mint ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`https://pump.fun/coin/${displayToken.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-lime-400 text-[10px] font-bold transition-colors inline-flex items-center gap-0.5"
                  >
                    <span>Pump</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href={`https://dexscreener.com/solana/${displayToken.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[10px] font-bold transition-colors inline-flex items-center gap-0.5"
                  >
                    <span>DEX</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* 3. Jupiter Swap Widget with dynamic outputMint and outputSymbol */}
            <JupiterSwapWidget
              outputMint={selectedToken.mint}
              outputSymbol={selectedToken.symbol}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Boost Modal Integration */}
      <BurnModal
        coin={boostCoin}
        isOpen={Boolean(boostCoin)}
        onClose={() => setBoostCoin(null)}
      />
    </div>
  );
}
