"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, Flame, FolderTree, Trophy, Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";

const BATON_CA = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump";

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
    <footer className="w-full border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#090A0D]/95 backdrop-blur-md py-10 mt-16 transition-colors text-xs font-mono text-zinc-600 dark:text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        {/* Top Row: Brand + Navigation + Token Info */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col gap-1.5">
            <Link href="/" className="flex items-center gap-2 group select-none">
              <div className="flex flex-col gap-1 w-5 h-3.5 justify-center">
                <span className="w-full h-0.5 bg-zinc-50 dark:bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
                <span className="w-4/5 h-0.5 bg-amber-500 rounded-full transition-transform group-hover:scale-x-125 origin-left" />
                <span className="w-3/5 h-0.5 bg-zinc-50 dark:bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
              </div>
              <span className="font-archivo text-lg tracking-tight flex items-center select-none">
                <span className="text-amber-500 font-bold tracking-tight">OUTBID</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium tracking-tight">.BOND</span>
              </span>
            </Link>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 max-w-sm">
              Solana Alpha Terminal &amp; Attention Auction Engine powered by real-time DEX liquidity &amp; $BATON on-chain burn mechanics.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-bold text-xs">
            <Link
              href="/terminal"
              className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Terminal</span>
            </Link>
            <Link
              href="/callouts"
              className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Live Callouts</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Directory</span>
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-emerald-500" />
              <span>Leaderboard</span>
            </Link>
          </div>

          {/* $BATON Contract Address Badge */}
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">$BATON CA:</span>
            <span className="text-[11px] text-zinc-700 dark:text-zinc-300">
              {BATON_CA.slice(0, 4)}...{BATON_CA.slice(-4)}
            </span>
            <button
              type="button"
              onClick={handleCopyCA}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors ml-1 cursor-pointer"
              title="Copy $BATON CA"
              aria-label="Copy $BATON CA"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <a
              href={`https://dexscreener.com/solana/${BATON_CA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-amber-500 transition-colors"
              title="View on DexScreener"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bottom Row: Copyright + Security Info */}
        <div className="pt-6 border-t border-zinc-200/60 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>© 2026 OUTBID.BOND — High Performance Solana Execution Engine.</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/batonoutbid"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors font-bold"
            >
              X
            </a>
            <span>•</span>
            <a
              href={`https://solscan.io/token/${BATON_CA}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Solscan Explorer
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
