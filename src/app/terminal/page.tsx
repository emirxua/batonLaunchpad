"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TrendingTokenItem } from "@/types/token";
import { JupiterSwapWidget } from "@/components/terminal/JupiterSwapWidget";
import { BurnModal } from "@/components/BurnModal";
import { Coin } from "@/types/coin";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Flame,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Radio,
  Search,
  RefreshCw,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TerminalPage() {
  const { data, isLoading, mutate } = useSWR(
    "/api/trending",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  );

  const [selectedTokenMint, setSelectedTokenMint] = useState<string>("");
  const [customTokens, setCustomTokens] = useState<any[]>([]);
  const [isSearchingCA, setIsSearchingCA] = useState(false);
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const [boostCoin, setBoostCoin] = useState<Coin | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync with URL query parameter ?token= if present on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("token");
      if (tokenParam) {
        setSelectedTokenMint(tokenParam);
      }
    }
  }, []);

  // Dynamic Fast CA Lookup when user pastes or types a Solana Mint
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length >= 32 && q.length <= 44 && !q.includes(" ")) {
      let isMounted = true;
      const ctrl = new AbortController();

      const lookupTokenCA = async () => {
        setIsSearchingCA(true);
        try {
          const res = await fetch(`/api/token-lookup?mint=${encodeURIComponent(q)}`, {
            signal: ctrl.signal,
          });
          if (!res.ok) return;
          const data = await res.json();

          if (data && data.mint && isMounted) {
            const price = data.priceUsd || 0;
            const mcap = data.marketCap || 0;
            const vol = data.volume24h || 0;
            const change = data.priceChange24h || 0;

            const customItem: any = {
              id: `token-${data.mint}`,
              name: data.name || "Custom Token",
              symbol: data.symbol || "TOKEN",
              ca: data.mint,
              price,
              priceFormatted:
                price < 0.001 ? `$${price.toFixed(6)}` : `$${price.toFixed(4)}`,
              mcap,
              mcapFormatted:
                mcap >= 1e6 ? `$${(mcap / 1e6).toFixed(1)}M` : `$${(mcap / 1e3).toFixed(0)}K`,
              volume24h: vol,
              volumeFormatted:
                vol >= 1e6 ? `$${(vol / 1e6).toFixed(1)}M` : `$${(vol / 1e3).toFixed(0)}K`,
              priceChange24h: change,
              priceChangeFormatted: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
              dexId: "DEX",
              badge: "Custom",
              iconUrl: data.iconUrl || undefined,
              dexScreenerUrl: data.pairAddress
                ? `https://dexscreener.com/solana/${data.pairAddress}`
                : `https://dexscreener.com/solana/${data.mint}`,
            };

            setCustomTokens((prev) => {
              const exists = prev.some((t) => t.ca.toLowerCase() === customItem.ca.toLowerCase());
              return exists ? prev : [customItem, ...prev];
            });

            setSelectedTokenMint(customItem.ca);
          }
        } catch {
          // Ignore aborted requests
        } finally {
          if (isMounted) setIsSearchingCA(false);
        }
      };

      lookupTokenCA();
      return () => {
        isMounted = false;
        ctrl.abort();
      };
    }
  }, [searchQuery]);

  const rawTokens: any[] = data?.tokens || data?.data || [];

  const tokensList: any[] = useMemo(() => {
    const list: any[] = rawTokens.map((t: any) => {
      const price = t.priceUsd ?? 0;
      const mcap = t.marketCap ?? t.fdv ?? 0;
      const vol = t.volume24h ?? 0;
      const change = t.priceChange24h ?? 0;
      const liq = t.liquidityUsd ?? 0;

      return {
        id: `token-${t.mint || t.ca}`,
        name: t.name || "Solana Token",
        symbol: (t.symbol || "TOKEN").toUpperCase(),
        ca: t.mint || t.ca,
        price,
        priceFormatted: t.priceFormatted || (price < 0.001 ? `$${price.toFixed(6)}` : `$${price.toFixed(4)}`),
        mcap,
        mcapFormatted: t.mcapFormatted || (mcap >= 1e6 ? `$${(mcap / 1e6).toFixed(1)}M` : `$${(mcap / 1e3).toFixed(0)}K`),
        volume24h: vol,
        volumeFormatted: t.volumeFormatted || (vol >= 1e6 ? `$${(vol / 1e6).toFixed(1)}M` : `$${(vol / 1e3).toFixed(0)}K`),
        liquidityUsd: liq,
        liquidityFormatted: t.liquidityFormatted || (liq >= 1e6 ? `$${(liq / 1e6).toFixed(1)}M` : `$${(liq / 1e3).toFixed(0)}K`),
        priceChange24h: change,
        priceChangeFormatted: t.priceChangeFormatted || `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
        dexId: (t.dexId || "PUMPSWAP").toUpperCase(),
        badge: t.badge || "Trending",
        iconUrl: t.iconUrl || undefined,
        dexScreenerUrl: t.dexScreenerUrl || `https://dexscreener.com/solana/${t.mint || t.ca}`,
      };
    });

    // Merge custom searched tokens
    const merged = [...customTokens];
    for (const item of list) {
      if (!merged.some((m) => m.ca.toLowerCase() === item.ca.toLowerCase())) {
        merged.push(item);
      }
    }
    return merged;
  }, [rawTokens, customTokens]);

  const selectedToken: any | null = useMemo(() => {
    if (tokensList.length === 0) return null;
    if (!selectedTokenMint) return tokensList[0];
    const found = tokensList.find(
      (t) => t.ca.toLowerCase() === selectedTokenMint.toLowerCase()
    );
    return found || tokensList[0];
  }, [selectedTokenMint, tokensList]);

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokensList;
    return tokensList.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ca.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, tokensList]);

  const isPositive = (selectedToken?.priceChange24h ?? 0) >= 0;

  const handleCopyCA = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleOpenBoost = () => {
    if (!selectedToken) return;
    setBoostCoin({
      id: `terminal-${selectedToken.ca}`,
      name: selectedToken.name,
      ticker: selectedToken.symbol,
      mintAddress: selectedToken.ca,
      imageUrl: selectedToken.iconUrl,
      iconColor: "#f59e0b",
      marketCap: selectedToken.mcap,
      volume24h: selectedToken.volume24h,
      change24h: selectedToken.priceChange24h,
      sparkline: [],
      totalBurnedBaton: 0,
      burnLevel: "none",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#08090C] text-zinc-900 dark:text-zinc-100 flex flex-col font-mono select-none">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ── Terminal Header Banner ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 flex items-center justify-center font-black text-sm shadow-md">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>SOLANA DEX EXECUTION TERMINAL</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  LIVE RPC
                </span>
              </h1>
              <p className="text-xs text-zinc-500">
                Direct RPC routes &bull; Instant Jupiter Execution &bull; $BATON Burn-to-Rank Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border border-zinc-200 dark:border-white/10 transition-colors cursor-pointer"
              title="Refresh Live Pairs"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleOpenBoost}
              disabled={!selectedToken}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>Boost Rank</span>
            </button>
          </div>
        </div>

        {/* ── Split Grid: Left Token List & Details, Right Swap Widget ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Left Column (7 cols): Token Selector & Chart Details ───── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Selected Token Details Banner */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 p-5 shadow-xl space-y-4">
              {!selectedToken ? (
                <div className="py-8 text-center text-xs text-zinc-500 animate-pulse">
                  Fetching live Solana pairs from DexScreener…
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 text-sm font-bold text-amber-400">
                        {selectedToken.iconUrl ? (
                          <img
                            src={selectedToken.iconUrl}
                            alt={selectedToken.symbol}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>${selectedToken.symbol.slice(0, 3)}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-zinc-950 dark:text-white">
                            ${selectedToken.symbol}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {selectedToken.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            {selectedToken.badge}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                          <span className="font-mono">
                            {selectedToken.ca.slice(0, 6)}…{selectedToken.ca.slice(-6)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCA(selectedToken.ca)}
                            className="hover:text-amber-400 transition-colors cursor-pointer"
                            title="Copy Contract Address"
                          >
                            {copiedMint === selectedToken.ca ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={selectedToken.dexScreenerUrl || `https://dexscreener.com/solana/${selectedToken.ca}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-amber-400 transition-colors flex items-center gap-1 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-white/10"
                            title="View on DexScreener"
                          >
                            <ExternalLink className="w-3 h-3 text-amber-400" />
                            <span>DexScreener</span>
                          </a>
                          <a
                            href={`https://solscan.io/token/${selectedToken.ca}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-amber-400 transition-colors"
                            title="View on Solscan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xl font-black text-zinc-950 dark:text-zinc-100">
                        {selectedToken.priceFormatted}
                      </div>
                      <div
                        className={`text-xs font-bold flex items-center sm:justify-end gap-1 ${
                          isPositive ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>{selectedToken.priceChangeFormatted} (24h)</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-4 gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-white/5 text-xs text-center font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">Market Cap</span>
                      <span className="font-extrabold text-amber-500 dark:text-amber-400">
                        {selectedToken.mcapFormatted}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">24h Volume</span>
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                        {selectedToken.volumeFormatted}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">Liquidity</span>
                      <span className="font-extrabold text-emerald-500 dark:text-emerald-400">
                        {selectedToken.liquidityFormatted || "$...K"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">DEX / AMM</span>
                      <span className="font-extrabold text-amber-500 uppercase">
                        {selectedToken.dexId || "PUMPSWAP"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick Token Selector List */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Select Live Solana Pair</span>
                </span>
                <span className="text-[10px] text-zinc-500">
                  {filteredTokens.length} Available
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name, symbol or CA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                />
                {isSearchingCA && (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Scrollable Tokens List */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredTokens.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                    {isLoading ? "Fetching live Solana pairs…" : "No tokens matching search."}
                  </div>
                ) : (
                  filteredTokens.map((t) => {
                    const isSelected =
                      selectedToken?.ca.toLowerCase() === t.ca.toLowerCase();
                    const isPos = t.priceChange24h >= 0;

                    return (
                      <div
                        key={t.ca}
                        onClick={() => setSelectedTokenMint(t.ca)}
                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md"
                            : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-100 dark:border-white/5 hover:border-amber-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-amber-400">
                            {t.iconUrl ? (
                              <img
                                src={t.iconUrl}
                                alt={t.symbol}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>${t.symbol.slice(0, 2)}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                              <span>${t.symbol}</span>
                              <span className="text-[10px] text-zinc-500 font-normal">
                                {t.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              MC: {t.mcapFormatted}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                            {t.priceFormatted}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              isPos ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            {t.priceChangeFormatted}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column (5 cols): Sticky Jupiter Swap Widget ─────── */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <JupiterSwapWidget
              defaultOutputMint={selectedToken?.ca}
              outputMint={selectedToken?.ca}
              outputSymbol={selectedToken?.symbol}
            />
          </div>
        </div>
      </main>

      {/* 3. Boost Rank Modal */}
      {boostCoin && (
        <BurnModal
          coin={boostCoin}
          isOpen={!!boostCoin}
          onClose={() => setBoostCoin(null)}
        />
      )}

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
