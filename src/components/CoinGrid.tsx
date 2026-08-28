"use client";

import React, { useState, useMemo } from "react";
import { Coin } from "@/types/coin";
import { CoinCard } from "./CoinCard";
import { Search, Flame, TrendingUp, Layers, Sparkles } from "lucide-react";

type FilterTab = "all" | "diamond" | "top-gainers" | "top-burned";

interface CoinGridProps {
  coins?: Coin[];
  isLoading?: boolean;
  onBurnClick?: (coin: Coin) => void;
}

export const CoinGrid: React.FC<CoinGridProps> = ({
  coins = [],
  isLoading = false,
  onBurnClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filteredCoins = useMemo(() => {
    let result = [...coins];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.ticker.toLowerCase().includes(q) ||
          c.mintAddress.toLowerCase().includes(q)
      );
    }

    // Tab filter & sorting
    switch (activeTab) {
      case "diamond":
        result = result.filter((c) => c.totalBurnedBaton >= 1_000_000);
        break;
      case "top-gainers":
        result.sort((a, b) => b.change24h - a.change24h);
        break;
      case "top-burned":
        result.sort((a, b) => b.totalBurnedBaton - a.totalBurnedBaton);
        break;
      default:
        break;
    }

    return result;
  }, [coins, searchQuery, activeTab]);

  return (
    <section id="directory" className="space-y-6 pt-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-bg-raised/70 p-4 rounded-2xl border border-line">
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 font-mono text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "all"
                ? "bg-acid text-bg border-acid font-bold shadow-[0_0_12px_rgba(212,255,63,0.2)]"
                : "bg-bg-card text-text-dim border-line hover:text-text hover:border-text-dim"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All ({coins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("diamond")}
            className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "diamond"
                ? "bg-acid text-bg border-acid font-bold shadow-[0_0_12px_rgba(212,255,63,0.2)]"
                : "bg-bg-card text-text-dim border-line hover:text-text hover:border-text-dim"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-acid" />
            <span>Diamond League</span>
          </button>

          <button
            onClick={() => setActiveTab("top-gainers")}
            className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "top-gainers"
                ? "bg-acid text-bg border-acid font-bold shadow-[0_0_12px_rgba(212,255,63,0.2)]"
                : "bg-bg-card text-text-dim border-line hover:text-text hover:border-text-dim"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-up" />
            <span>Top Gainers</span>
          </button>

          <button
            onClick={() => setActiveTab("top-burned")}
            className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "top-burned"
                ? "bg-acid text-bg border-acid font-bold shadow-[0_0_12px_rgba(212,255,63,0.2)]"
                : "bg-bg-card text-text-dim border-line hover:text-text hover:border-text-dim"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-magenta" />
            <span>Most Burned</span>
          </button>
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coin or ticker..."
            className="w-full bg-bg-card border border-line rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-text placeholder:text-text-faint focus:border-acid transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-text-dim hover:text-text text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading && coins.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="rounded-2xl border border-line bg-bg-card p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-raised" />
                  <div className="space-y-1.5">
                    <div className="w-24 h-4 rounded bg-bg-raised" />
                    <div className="w-12 h-3 rounded bg-bg-raised" />
                  </div>
                </div>
                <div className="w-16 h-5 rounded-full bg-bg-raised" />
              </div>
              <div className="h-10 rounded-lg bg-bg-raised/70" />
              <div className="space-y-2 pt-2 border-t border-line/60">
                <div className="flex justify-between">
                  <div className="w-16 h-3 rounded bg-bg-raised" />
                  <div className="w-14 h-3 rounded bg-bg-raised" />
                </div>
                <div className="flex justify-between">
                  <div className="w-14 h-3 rounded bg-bg-raised" />
                  <div className="w-12 h-3 rounded bg-bg-raised" />
                </div>
              </div>
              <div className="h-9 rounded-xl bg-bg-raised" />
            </div>
          ))}
        </div>
      ) : filteredCoins.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCoins.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              onBurnClick={onBurnClick}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-line bg-bg-card space-y-3 font-mono">
          <div className="text-text-faint text-3xl">🔍</div>
          <div className="text-text text-base font-bold">No Results Found</div>
          <p className="text-xs text-text-dim max-w-sm mx-auto">
            No mascot coin found matching &quot;{searchQuery}&quot;. Please try a different search term.
          </p>
        </div>
      )}
    </section>
  );
};
