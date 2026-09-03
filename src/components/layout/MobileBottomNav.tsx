"use client";

import React, { useState } from "react";
import { Zap, Radio, Trophy, Flame } from "lucide-react";
import { JupiterSwapModal } from "@/components/modals/JupiterSwapModal";

interface MobileBottomNavProps {
  activeTab: "trending" | "callouts" | "leaderboard";
  onSelectTab: (tab: "trending" | "callouts" | "leaderboard") => void;
  targetMint: string;
  targetSymbol: string;
  targetName?: string;
  targetIconUrl?: string;
  onOpenSwapModal?: () => void;
  onOpenBurnModal?: () => void;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  targetMint,
  targetSymbol,
  targetName,
  targetIconUrl,
  onOpenSwapModal,
  onOpenBurnModal,
}: MobileBottomNavProps) {
  const [isLocalSwapModalOpen, setIsLocalSwapModalOpen] = useState(false);

  const handleTabClick = (tab: "trending" | "callouts" | "leaderboard") => {
    setIsLocalSwapModalOpen(false);
    onSelectTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSwapClick = () => {
    if (onOpenSwapModal) {
      onOpenSwapModal();
    } else {
      setIsLocalSwapModalOpen(true);
    }
  };

  const handleBurnClick = () => {
    if (onOpenBurnModal) {
      onOpenBurnModal();
    } else {
      handleTabClick("leaderboard");
    }
  };

  return (
    <>
      {/* ── Fixed Bottom Navigation Bar (Mobile Only: hidden on md+) ────── */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090B10]/95 backdrop-blur-2xl border-t border-zinc-200 dark:border-white/10 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,10px),10px)] select-none font-mono shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
          {/* Tab 1: Signals / Callouts */}
          <button
            type="button"
            onClick={() => handleTabClick("callouts")}
            className={`flex flex-col items-center justify-center gap-1 h-12 rounded-2xl transition-all duration-150 active:scale-90 ${
              activeTab === "callouts" && !isLocalSwapModalOpen
                ? "text-amber-500 dark:text-amber-400 bg-amber-500/15 font-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="text-[10px] tracking-tight font-bold">Signals</span>
          </button>

          {/* Tab 2: Trending */}
          <button
            type="button"
            onClick={() => handleTabClick("trending")}
            className={`flex flex-col items-center justify-center gap-1 h-12 rounded-2xl transition-all duration-150 active:scale-90 ${
              activeTab === "trending" && !isLocalSwapModalOpen
                ? "text-amber-500 dark:text-amber-400 bg-amber-500/15 font-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[10px] tracking-tight font-bold">Trending</span>
          </button>

          {/* Tab 3: Center Jupiter Swap Button (Touch-Friendly Elevated Pill) */}
          <button
            type="button"
            onClick={handleSwapClick}
            className="flex flex-col items-center justify-center gap-0.5 h-12 rounded-2xl transition-transform duration-150 active:scale-90 relative -top-1"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/40">
              <svg
                className="w-5 h-5 transition-transform duration-200 hover:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 10h14l-4-4" />
                <path d="M17 14H3l4 4" />
              </svg>
            </div>
            <span className="text-[9px] tracking-wider uppercase font-black text-amber-500 dark:text-amber-400">
              Swap
            </span>
          </button>

          {/* Tab 4: Ranking / Leaderboard */}
          <button
            type="button"
            onClick={() => handleTabClick("leaderboard")}
            className={`flex flex-col items-center justify-center gap-1 h-12 rounded-2xl transition-all duration-150 active:scale-90 ${
              activeTab === "leaderboard" && !isLocalSwapModalOpen
                ? "text-amber-500 dark:text-amber-400 bg-amber-500/15 font-black shadow-sm"
                : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] tracking-tight font-bold">Ranking</span>
          </button>

          {/* Tab 5: Burn & Boost */}
          <button
            type="button"
            onClick={handleBurnClick}
            className="flex flex-col items-center justify-center gap-1 h-12 rounded-2xl transition-all duration-150 active:scale-90 text-orange-500 hover:text-orange-400"
            title="Burn $BATON & Boost"
          >
            <Flame className="w-4 h-4 fill-current text-orange-500 animate-pulse" />
            <span className="text-[10px] tracking-tight font-bold text-orange-500">Boost</span>
          </button>
        </div>
      </nav>

      {/* ── Direct Mobile Jupiter Swap Modal ────────────────────────────── */}
      {isLocalSwapModalOpen && (
        <JupiterSwapModal
          isOpen={isLocalSwapModalOpen}
          onClose={() => setIsLocalSwapModalOpen(false)}
          targetMint={targetMint}
          targetSymbol={targetSymbol}
          targetName={targetName}
          targetIconUrl={targetIconUrl}
        />
      )}
    </>
  );
}

export default MobileBottomNav;
