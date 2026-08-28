import React from "react";
import Image from "next/image";
import { Flame, Coins, Trophy, AlertTriangle, ExternalLink } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface HeroProps {
  totalBurnedBaton?: number;
  activeCoinsCount?: number;
  topCommunityTicker?: string;
  topCommunityTier?: string;
  headerUrl?: string;
}

export const Hero: React.FC<HeroProps> = ({
  totalBurnedBaton = 1_450_000,
  activeCoinsCount = 1,
  topCommunityTicker = "$BATON",
  topCommunityTier = "DIAMOND",
  headerUrl = "https://cdn.dexscreener.com/cms/images/vVNqFVaQ0jWxKguy?width=1500&height=500&quality=95&format=auto",
}) => {
  return (
    <section className="relative w-full overflow-hidden border-b border-line bg-bg py-12 sm:py-16">
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
        className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-acid/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-magenta/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
        {/* 1. Eyebrow Tag */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-line bg-bg-raised/90 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-acid opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-acid shadow-[0_0_10px_#d4ff3f]" />
            </span>
            <span className="font-mono text-[11px] text-text-faint uppercase tracking-wider font-semibold">
              OFFICIAL SOLANA MASCOT &amp; BURN LAUNCHPAD — $BATON
            </span>
          </div>

          <a
            href="https://x.com/buybaton"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-bg-raised/90 text-text-dim hover:text-text hover:border-text-dim font-mono text-[11px] font-bold transition-all"
          >
            <span>@buybaton on X</span>
            <ExternalLink className="w-3 h-3 text-acid" />
          </a>
        </div>

        {/* 2. Main Heading & 3. Description */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="font-archivo uppercase text-[clamp(32px,5vw,64px)] leading-[1.05] tracking-tight text-text">
            Solana&apos;s Strongest Mascots.{" "}
            <span className="text-acid underline decoration-acid/30 underline-offset-8">
              On One Screen.
            </span>
          </h1>

          <p className="font-space text-base sm:text-lg text-text-dim max-w-[560px] leading-relaxed">
            Showcase your community&apos;s strength, burn{" "}
            <span className="text-acid font-semibold">$BATON</span> to elevate
            your mascot to Diamond League.
          </p>
        </div>

        {/* 4. Stats Strip - 3 Mini Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Total Burned $BATON */}
          <div className="p-4 rounded-xl border border-line bg-bg-card hover:border-acid/30 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">
                Total Burned $BATON
              </span>
              <Flame className="w-4 h-4 text-magenta group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-text font-mono-num tracking-tight">
              {formatNumber(totalBurnedBaton)}
            </div>
            <div className="font-mono text-[10px] text-magenta font-semibold mt-1">
              🔥 Permanently Burned on Solana
            </div>
          </div>

          {/* Card 2: Active Listed Assets */}
          <div className="p-4 rounded-xl border border-line bg-bg-card hover:border-acid/30 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">
                Active Listed Tokens
              </span>
              <Coins className="w-4 h-4 text-acid group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-text font-mono-num tracking-tight">
              {activeCoinsCount} <span className="text-sm font-normal text-text-dim">Project{activeCoinsCount === 1 ? "" : "s"}</span>
            </div>
            <div className="font-mono text-10px text-acid font-semibold mt-1">
              ✓ Verified pump.fun Communities
            </div>
          </div>

          {/* Card 3: Top Community */}
          <div className="p-4 rounded-xl border border-line bg-bg-card hover:border-[#70d6ff]/40 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">
                Leading Community
              </span>
              <Trophy className="w-4 h-4 text-[#70d6ff] group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-[#70d6ff] font-mono-num tracking-tight flex items-center gap-2">
              <span>{topCommunityTicker}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-[#70d6ff]/40 bg-[#70d6ff]/10 text-[#a5e5ff] uppercase font-bold">
                {topCommunityTier}
              </span>
            </div>
            <div className="font-mono text-[10px] text-text-dim mt-1">
              ★ Highest Burn Volume Leader
            </div>
          </div>
        </div>

        {/* 5. Legal / Fan-Made Warning Box */}
        <div className="p-3.5 rounded-xl border border-dashed border-line bg-bg-raised/70 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-acid shrink-0" />
          <p className="font-mono text-[11px] text-text-faint leading-relaxed">
            ⚠ Community directory and showcase. No official affiliation with listed external meme projects. Crypto assets are volatile. DYOR.
          </p>
        </div>
      </div>
    </section>
  );
};
