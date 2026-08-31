"use client";

import React, { useState } from "react";
import { Zap, Radio, Trophy } from "lucide-react";
import { JupiterSwapModal } from "@/components/modals/JupiterSwapModal";

interface MobileBottomNavProps {
  activeTab: "trending" | "callouts" | "leaderboard";
  onSelectTab: (tab: "trending" | "callouts" | "leaderboard") => void;
  targetMint: string;
  targetSymbol: string;
  targetName?: string;
  targetIconUrl?: string;
  onOpenSwapModal?: () => void;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  targetMint,
  targetSymbol,
  targetName,
  targetIconUrl,
  onOpenSwapModal,
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

  return (
    <>
      {/* ── Fixed Bottom Navigation Bar (Mobile Only: hidden on md+) ────── */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090A0D]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,8px),8px)] select-none font-mono shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
      >
        <div className="grid grid-cols-4 gap-1 items-center max-w-md mx-auto">
          {/* Tab 1: Callouts */}
          <button
            type="button"
            onClick={() => handleTabClick("callouts")}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 ${
              activeTab === "callouts" && !isLocalSwapModalOpen
                ? "text-amber-500 bg-amber-500/10 font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Callouts</span>
          </button>

          {/* Tab 2: Trending */}
          <button
            type="button"
            onClick={() => handleTabClick("trending")}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 ${
              activeTab === "trending" && !isLocalSwapModalOpen
                ? "text-amber-500 bg-amber-500/10 font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Trending</span>
          </button>

          {/* Tab 3: Quick Swap Trigger */}
          <button
            type="button"
            onClick={handleSwapClick}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 relative ${
              isLocalSwapModalOpen
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
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all active:scale-95 ${
              activeTab === "leaderboard" && !isLocalSwapModalOpen
                ? "text-amber-500 bg-amber-500/10 font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">Leaderboard</span>
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
