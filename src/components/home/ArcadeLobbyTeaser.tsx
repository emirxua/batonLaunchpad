"use client";

import React from "react";
import Link from "next/link";
import { Swords, TrendingUp, ArrowRight } from "lucide-react";

export function ArcadeLobbyTeaser() {
  return (
    <div className="w-full bg-zinc-900/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3 font-mono shadow-lg select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wider">
          <Swords className="w-3.5 h-3.5 text-amber-400" />
          <span>DEGEN ARCADE — LIVE ARENA</span>
        </div>
        <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5 font-medium">
          ON-CHAIN
        </span>
      </div>

      {/* Lobby Rows */}
      <div className="space-y-2">
        {/* Row 1: 1v1 Burn Duel */}
        <div className="p-2.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-950 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span>1v1 BURN DUEL</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                1/2 WAITING
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Pool: <span className="text-amber-400 font-bold">10,000 $BATON</span>
            </div>
          </div>

          <Link
            href="/arcade?game=duel"
            className="px-3 py-1 rounded bg-amber-500/15 hover:bg-amber-500 border border-amber-500/40 text-amber-400 hover:text-black font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shrink-0"
          >
            [ JOIN ]
          </Link>
        </div>

        {/* Row 2: Price Prediction */}
        <div className="p-2.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-950 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span>PRICE PREDICTION</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Pair: <span className="text-zinc-200">SOL/USD (30S)</span>
            </div>
          </div>

          <Link
            href="/arcade?game=prediction"
            className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-white/10 hover:border-white/20 text-zinc-200 hover:text-white font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shrink-0"
          >
            [ PLAY ]
          </Link>
        </div>
      </div>

      {/* Bottom Link */}
      <Link
        href="/arcade"
        className="text-[11px] font-bold text-amber-400/90 hover:text-amber-300 flex items-center justify-between pt-1 group transition-colors"
      >
        <span>ENTER FULL ARCADE LOBBY</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

export default ArcadeLobbyTeaser;
