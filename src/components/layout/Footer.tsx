"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Flame,
  Trophy,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

const BATON_CA = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

export const Footer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCA = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(BATON_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#07080A]/95 backdrop-blur-xl pt-6 pb-28 md:pb-8 mt-8 transition-colors text-xs font-mono text-zinc-600 dark:text-zinc-400 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* ── Main Unified Row: Brand, Quick Links, $BATON CA, Social ─── */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
              <div className="flex flex-col justify-center gap-1 w-4 h-3.5">
                <span className="w-full h-0.5 bg-[#f59e0b] rounded-full" />
                <span className="w-3/4 h-0.5 bg-[#f59e0b] rounded-full" />
                <span className="w-full h-0.5 bg-[#f59e0b] rounded-full" />
              </div>
              <div className="text-base font-black tracking-wider flex items-center font-mono">
                <span className="text-[#f59e0b]">OUTBID</span>
                <span className="text-[9px] ml-2 px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  TERMINAL
                </span>
              </div>
            </Link>
          </div>

          {/* Center / Right: Nav links, $BATON CA, X button */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
            <Link
              href="/callouts"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              <Flame className="w-3 h-3 text-orange-500 fill-current" />
              <span>Callouts</span>
            </Link>

            <Link
              href="/terminal"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Terminal</span>
            </Link>

            <Link
              href="/leaderboard"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
            >
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Burn Leaderboard</span>
            </Link>

            {/* $BATON CA Pill */}
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 px-2.5 py-1 rounded-xl text-[11px]">
              <span className="text-zinc-500 font-bold">$BATON:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {BATON_CA.slice(0, 4)}…{BATON_CA.slice(-4)}
              </span>
              <button
                type="button"
                onClick={handleCopyCA}
                className="hover:text-amber-400 text-zinc-400 transition-colors cursor-pointer"
                title="Copy $BATON Address"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <a
                href={`https://solscan.io/token/${BATON_CA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-400 text-zinc-400 transition-colors"
                title="View on Solscan"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* X (Twitter) Link */}
            <a
              href="https://x.com/batonoutbid"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-500/10 text-zinc-800 dark:text-zinc-200 hover:text-amber-400 border border-zinc-200 dark:border-white/10 transition-all font-bold"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@batonoutbid</span>
            </a>
          </div>
        </div>

        {/* ── Sub Row: Copyright + Powered By + Disclaimer ────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-white/[0.05] text-[10px] text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} Outbid Terminal. All rights reserved.
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#9945FF] shadow-[0_0_6px_#9945FF]" />
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_6px_#F59E0B]" />
            <span>Powered by Solana &amp; $BATON Burn Engine</span>
          </div>

          <div className="flex items-center gap-1 text-zinc-500 italic">
            <ShieldCheck className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Decentralized terminal. Trading involves risk.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
