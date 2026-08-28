import React from "react";
import { Flame, Rocket, Plus, Wallet } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="border-b border-line bg-bg/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-acid/10 border border-acid/30 flex items-center justify-center text-acid shadow-[0_0_20px_rgba(212,255,63,0.15)]">
            <Flame className="w-6 h-6 fill-acid/20 text-acid animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-archivo text-xl tracking-wide text-text">
                $BATON
              </span>
              <span className="text-xs bg-acid/20 text-acid px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                LAUNCHPAD
              </span>
            </div>
            <p className="text-[11px] text-text-dim hidden sm:block">
              Solana pump.fun Memecoin Boost Showcase
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-line bg-bg-raised text-xs text-text-dim hover:text-text hover:border-text-dim transition-all">
            <Rocket className="w-4 h-4 text-magenta" />
            <span>How Burning Works</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-card border border-acid/40 text-acid hover:bg-acid hover:text-bg font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(212,255,63,0.1)]">
            <Plus className="w-4 h-4" />
            <span>List Mascot</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-acid text-bg font-mono text-xs font-bold hover:bg-acid-dim transition-all shadow-[0_0_20px_rgba(212,255,63,0.3)]">
            <Wallet className="w-4 h-4" />
            <span>Connect Wallet</span>
          </button>
        </div>
      </div>
    </header>
  );
};
