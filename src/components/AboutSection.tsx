"use client";

import React from "react";
import Link from "next/link";
import {
  Radio,
  Flame,
  Zap,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function AboutSection() {
  return (
    <section className="w-full space-y-4 font-mono select-none">
      {/* ── Ultra-Compact Sleek Header ─────────────────────────────────── */}
      <div className="relative rounded-xl border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-[#0d0e12] to-zinc-950 px-4 py-3 sm:px-5 sm:py-3.5 overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="space-y-0.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>OUTBID PROTOCOL ARCHITECTURE</span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
              HOW OUTBID WORKS &amp;{" "}
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                ECOSYSTEM MECHANICS
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400 max-w-xl">
              Decentralized attention auction and zero-latency DEX execution terminal on Solana.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/10 text-center shadow-sm">
              <span className="text-[9px] text-zinc-500 uppercase font-bold block">ROUTING</span>
              <span className="text-xs font-bold text-amber-400">Jupiter V6</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/10 text-center shadow-sm">
              <span className="text-[9px] text-zinc-500 uppercase font-bold block">PROOF</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> On-Chain
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 Main Pillar Info Cards (Ultra-Minimalist Grid) ────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Pillar 1: Zero-Noise Alpha */}
        <Link
          href="/callouts"
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 hover:border-rose-500/40 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-orange-500 opacity-80" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider">
                01 · SIGNALS
              </span>
            </div>

            <h3 className="font-archivo text-sm font-black text-zinc-950 dark:text-white uppercase tracking-tight">
              Zero-Noise Alpha
            </h3>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
              Curated, high-conviction signals from top traders. Zero spam; verified multipliers and pump.fun tokens with 1-click swap.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[11px] text-rose-500 font-bold">
            <span>Verified Callouts</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Pillar 2: Burn-to-Rank Engine */}
        <Link
          href="/leaderboard"
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 opacity-80" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-current text-orange-500" />
              </div>
              <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">
                02 · AUCTION
              </span>
            </div>

            <h3 className="font-archivo text-sm font-black text-zinc-950 dark:text-white uppercase tracking-tight">
              Burn-to-Rank Engine
            </h3>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
              No paid ads. Tokens compete for top spotlight visibility strictly by burning $BATON on-chain, permanently deflating supply.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[11px] text-amber-500 font-bold">
            <span>100% On-Chain Proof</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Pillar 3: Fast Execution */}
        <Link
          href="/terminal"
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 hover:border-emerald-500/40 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">
                03 · DEX ENGINE
              </span>
            </div>

            <h3 className="font-archivo text-sm font-black text-zinc-950 dark:text-white uppercase tracking-tight">
              Fast Execution
            </h3>

            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
              Direct Solana RPC routing powered by Jupiter V6. Execute instant orders on any token with sub-second finality.
            </p>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-[11px] text-emerald-500 font-bold">
            <span>Instant Swap Terminal</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* ── Official Social Banner (Ultra-Thin Bar) ───────────────────── */}
      <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-2 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-white shrink-0">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-950 dark:text-white">
              Stay Connected with Outbid Community
            </h4>
            <p className="text-[10px] text-zinc-500">
              Official announcements, burns, and whale callout alerts on X.
            </p>
          </div>
        </div>

        <a
          href="https://x.com/metoutbid"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-[11px] flex items-center gap-1.5 transition-all uppercase tracking-wider shadow-sm shrink-0 cursor-pointer active:scale-95"
        >
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>Follow @metoutbid</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </section>
  );
}

export default AboutSection;
