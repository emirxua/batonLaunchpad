"use client";

import React, { useState } from "react";
import { Zap, Radio, Trophy, Flame, X } from "lucide-react";
import { QuickSwapCard } from "@/components/home/QuickSwapCard";

interface MobileBottomNavProps {
  activeTab: "trending" | "callouts" | "leaderboard";
  onSelectTab: (tab: "trending" | "callouts" | "leaderboard") => void;
  targetMint: string;
  targetSymbol: string;
  targetName?: string;
  onTokenChange?: (mint: string, symbol: string) => void;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  targetMint,
  targetSymbol,
  targetName,
  onTokenChange,
}: MobileBottomNavProps) {
  const [isSwapDrawerOpen, setIsSwapDrawerOpen] = useState(false);

  const handleTabClick = (tab: "trending" | "callouts" | "leaderboard") => {
    setIsSwapDrawerOpen(false);
    onSelectTab(tab);
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  return (
    <>
      {/* ── Fixed Bottom Navigation Bar (Mobile Only: hidden on md+) ────── */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090A0D]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 px-2 pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)] select-none font-mono shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
      >
        <div className="grid grid-cols-4 gap-1 items-center max-w-md mx-auto">
          {/* Tab 1: Trending */}
          <button
            type="button"
            onClick={() => handleTabClick("trending")}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all ${
              activeTab === "trending" && !isSwapDrawerOpen
                ? "text-amber-500 bg-amber-500/10 font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Trending</span>
          </button>

          {/* Tab 2: Callouts */}
          <button
            type="button"
            onClick={() => handleTabClick("callouts")}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all ${
              activeTab === "callouts" && !isSwapDrawerOpen
                ? "text-amber-500 bg-amber-500/10 font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Callouts</span>
          </button>

          {/* Tab 3: Quick Swap Trigger (Drawer) */}
          <button
            type="button"
            onClick={() => setIsSwapDrawerOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all relative ${
              isSwapDrawerOpen
                ? "text-zinc-950 bg-amber-500 font-black shadow-md shadow-amber-500/30 scale-105"
                : "text-amber-500 hover:text-amber-400 font-bold"
            }`}
          >
            <div className="relative">
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 animate-ping" />
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[10px] tracking-tight uppercase font-extrabold">Swap</span>
          </button>

          {/* Tab 4: Leaderboard */}
          <button
            type="button"
            onClick={() => handleTabClick("leaderboard")}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all ${
              activeTab === "leaderboard" && !isSwapDrawerOpen
                ? "text-amber-500 bg-amber-500/10 font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Leaderboard</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile Bottom Swap Drawer / Sheet ───────────────────────────── */}
      {isSwapDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full bg-white dark:bg-[#0D0E12] border-t border-amber-500/30 rounded-t-3xl p-4 sm:p-6 space-y-4 max-h-[90dvh] overflow-y-auto pb-[max(env(safe-area-inset-bottom,16px),16px)] animate-in slide-in-from-bottom duration-250 shadow-2xl"
          >
            {/* Drawer Handle & Header */}
            <div className="flex flex-col items-center gap-2 pb-2 border-b border-zinc-200 dark:border-white/10">
              <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider font-mono">
                    Quick Swap Drawer
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSwapDrawerOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Swap Card in Drawer */}
            <QuickSwapCard
              targetMint={targetMint}
              targetSymbol={targetSymbol}
              targetName={targetName}
              onTokenChange={(mint, symbol) => {
                if (onTokenChange) onTokenChange(mint, symbol);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default MobileBottomNav;
