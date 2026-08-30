"use client";

import React from "react";
import Image from "next/image";
import { Flame, Coins, Trophy, AlertTriangle, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useTokenStats } from "@/hooks/useTokenStats";

interface HeroProps {
  totalBurnedBaton?: number;
  activeCoinsCount?: number;
  topCommunityTicker?: string;
  topCommunityTier?: string;
  headerUrl?: string;
}

export const Hero: React.FC<HeroProps> = ({
  totalBurnedBaton: propBurned,
  activeCoinsCount = 1,
  topCommunityTicker = "$BATON",
  topCommunityTier = "DIAMOND",
  headerUrl = "https://cdn.dexscreener.com/cms/images/vVNqFVaQ0jWxKguy?width=1500&height=500&quality=95&format=auto",
}) => {
  const { totalBurned: onChainBurned } = useTokenStats(15_000);
  const totalBurnedBaton = propBurned !== undefined && propBurned > 0 ? propBurned : onChainBurned;

  return (
    <section className="relative w-full overflow-hidden border-b border-line bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-[#0a0b0d] dark:via-[#0e1014] dark:to-[#0a0b0d] py-12 sm:py-16">
      {/* Background Banner Cover Overlay */}
      {headerUrl && (
        <div className="pointer-events-none absolute inset-0 z-0 opacity-15 overflow-hidden">
          <Image
            src={headerUrl}
            alt="Baton Cover"
            fill
            className="object-cover object-center filter blur-[2px] scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/85 to-bg" />
        </div>
      )}

      {/* Background 5% Radial Gradient Spotlights */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 dark:bg-acid/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-rose-500/10 dark:bg-magenta/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* 1. Eyebrow Tag */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-zinc-200/80 dark:border-line bg-white/90 dark:bg-bg-raised/90 backdrop-blur shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-acid opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 dark:bg-acid shadow-[0_0_10px_#059669]" />
            </span>
            <span className="font-mono text-[11px] text-zinc-600 dark:text-text-faint uppercase tracking-wider font-semibold">
              COMMUNITY DIRECTORY &amp; ON-CHAIN BURN ENGINE — $BATON
            </span>
          </div>

          <a
            href="https://x.com/metoutbid"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-200/80 dark:border-line bg-white/90 dark:bg-bg-raised/90 text-zinc-700 dark:text-text-dim hover:text-zinc-900 dark:hover:text-text font-mono text-[11px] font-bold shadow-sm transition-all"
          >
            <span>@metoutbid on X</span>
            <ExternalLink className="w-3 h-3 text-amber-500 dark:text-acid" />
          </a>
        </div>

        {/* 2. Main Heading & 3. Description */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="font-archivo uppercase text-[clamp(32px,5vw,64px)] leading-[1.05] tracking-tight text-zinc-900 dark:text-text">
            Solana&apos;s Strongest Mascots.{" "}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-acid dark:via-lime-400 dark:to-acid bg-clip-text text-transparent underline decoration-emerald-500/30 underline-offset-8">
              On One Screen.
            </span>
          </h1>

          <p className="font-space text-base sm:text-lg text-zinc-600 dark:text-text-dim max-w-[560px] leading-relaxed">
            Showcase your community&apos;s strength, burn{" "}
            <span className="text-emerald-600 dark:text-acid font-bold">$BATON</span> to elevate
            your mascot to Diamond League.
          </p>
        </div>

        {/* 4. Stats Strip - 3 Mini Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Total Burned $BATON */}
          <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-line bg-white/85 dark:bg-bg-card shadow-md shadow-zinc-200/50 dark:shadow-none hover:border-emerald-500/30 dark:hover:border-acid/30 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-text-faint font-semibold">
                Total Burned $BATON
              </span>
              <Flame className="w-4 h-4 text-rose-500 dark:text-magenta group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-zinc-900 dark:text-text font-mono-num tracking-tight">
              {formatNumber(totalBurnedBaton)}
            </div>
            <div className="font-mono text-[11px] text-rose-600 dark:text-magenta font-bold mt-1">
              🔥 Permanently Burned on Solana
            </div>
          </div>

          {/* Card 2: Active Listed Assets */}
          <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-line bg-white/85 dark:bg-bg-card shadow-md shadow-zinc-200/50 dark:shadow-none hover:border-emerald-500/30 dark:hover:border-acid/30 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-text-faint font-semibold">
                Active Listed Tokens
              </span>
              <Coins className="w-4 h-4 text-emerald-600 dark:text-acid group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-zinc-900 dark:text-text font-mono-num tracking-tight">
              {activeCoinsCount} <span className="text-sm font-medium text-zinc-500 dark:text-text-dim">Project{activeCoinsCount === 1 ? "" : "s"}</span>
            </div>
            <div className="font-mono text-[11px] text-emerald-600 dark:text-acid font-bold mt-1">
              ✓ Verified pump.fun Communities
            </div>
          </div>

          {/* Card 3: Top Community */}
          <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-line bg-white/85 dark:bg-bg-card shadow-md shadow-zinc-200/50 dark:shadow-none hover:border-sky-500/30 dark:hover:border-[#70d6ff]/40 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-text-faint font-semibold">
                Leading Community
              </span>
              <Trophy className="w-4 h-4 text-sky-600 dark:text-[#70d6ff] group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-sky-600 dark:text-[#70d6ff] font-mono-num tracking-tight flex items-center gap-2">
              <span>{topCommunityTicker}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-sky-300 dark:border-[#70d6ff]/40 bg-sky-50 dark:bg-[#70d6ff]/10 text-sky-700 dark:text-[#a5e5ff] uppercase font-bold">
                {topCommunityTier}
              </span>
            </div>
            <div className="font-mono text-[11px] text-zinc-500 dark:text-text-dim font-medium mt-1">
              ★ Highest Burn Volume Leader
            </div>
          </div>
        </div>

        {/* 5. Legal / Fan-Made Warning Box */}
        <div className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-line bg-white/60 dark:bg-bg-raised/70 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="font-mono text-[11px] text-zinc-500 dark:text-text-faint leading-relaxed">
            ⚠ Community directory and showcase. No official affiliation with listed external meme projects. Crypto assets are volatile. DYOR.
          </p>
        </div>
      </div>
    </section>
  );
};
