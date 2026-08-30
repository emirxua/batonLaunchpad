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
  BookOpen,
  ShieldAlert,
  Sparkles,
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
    <footer className="w-full border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#090A0D]/95 backdrop-blur-md py-10 mt-16 transition-colors text-xs font-mono text-zinc-600 dark:text-zinc-400 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        {/* ── Top Row: Brand + Navigation + Social Links ─────────────────── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex items-center gap-3 select-none cursor-pointer flex-shrink-0">
              <div className="flex flex-col justify-center gap-[4px]">
                <span className="w-5 h-[3px] bg-[#f59e0b] rounded-full"></span>
                <span className="w-5 h-[3px] bg-[#f59e0b] rounded-full"></span>
                <span className="w-5 h-[3px] bg-[#f59e0b] rounded-full"></span>
              </div>
              <div className="text-xl font-black tracking-wider flex items-center select-none font-mono">
                <span className="text-[#f59e0b]">OUTBID</span>
                <span className="text-[10px] ml-2 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  TERMINAL
                </span>
              </div>
            </Link>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Solana Alpha Callouts &amp; Instant DEX Terminal powered by zero-delay execution and fair Burn-to-Rank mechanics.
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-bold text-xs">
            <Link
              href="/callouts"
              className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-current" />
              <span>Alpha Callouts</span>
            </Link>
            <Link
              href="/terminal"
              className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Terminal Swap</span>
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard</span>
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
              <span>Docs / About</span>
            </Link>

            {/* Official X (Twitter) Direct Link */}
            <a
              href="https://x.com/batonoutbid"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-500/10 text-zinc-900 dark:text-zinc-100 hover:text-amber-400 border border-zinc-200 dark:border-white/10 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@batonoutbid</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>
        </div>

        {/* ── Middle Row: Powered by Solana & $BATON Engine + CA ─────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 border-y border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/30 px-4 rounded-2xl">
          {/* Powered by Solana & BATON Badge */}
          <div className="flex items-center gap-2.5">
            <div className="flex -space-x-1 items-center">
              <span className="w-3 h-3 rounded-full bg-[#14F195] shadow-[0_0_8px_#14F195]" />
              <span className="w-3 h-3 rounded-full bg-[#9945FF] shadow-[0_0_8px_#9945FF]" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-zinc-900 dark:text-white">
                Powered by Solana &amp; $BATON Burn Engine
              </span>
              <span className="text-[10px] text-zinc-500 block">
                100% On-Chain Deflationary Mechanics
              </span>
            </div>
          </div>

          {/* Official $BATON CA Copy Bar */}
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[11px] text-zinc-500">$BATON CA:</span>
            <span className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
              {BATON_CA.slice(0, 4)}…{BATON_CA.slice(-4)}
            </span>
            <button
              type="button"
              onClick={handleCopyCA}
              className="p-1 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="Copy Contract Address"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={`https://solscan.io/token/${BATON_CA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-zinc-400 hover:text-amber-400 transition-colors"
              title="View on Solscan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ── Bottom Row: Copyright + Terms / Disclaimer ────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} Outbid Terminal. All rights reserved.
          </div>

          {/* Mandatory Disclaimer */}
          <div className="flex items-center gap-1.5 text-center sm:text-right">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="italic">
              &ldquo;Outbid is a decentralized terminal interface. Crypto trading involves substantial risk.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
