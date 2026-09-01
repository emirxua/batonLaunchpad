"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TokenLogo } from "@/components/callouts/TokenLogo";
import { CallerAvatar } from "@/components/callouts/CallerAvatar";
import {
  Radio,
  Flame,
  ArrowRight,
  TrendingUp,
  ThumbsUp,
  Zap,
} from "lucide-react";

interface LiveCalloutsFeedProps {
  onSelectToken?: (ca: string, symbol: string, name?: string) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LiveCalloutsFeed({ onSelectToken }: LiveCalloutsFeedProps) {
  const { data } = useSWR("/api/callouts", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const [upvotes, setUpvotes] = useState<Record<string, number>>({});

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const raw = data?.callouts || [];
  const callouts = raw.slice(0, 3);

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4 font-mono shadow-xl select-none">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          <h2 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
            Verified Alpha Feed
          </h2>
        </div>
        <Link
          href="/callouts"
          className="text-xs text-amber-500 hover:underline flex items-center gap-1 font-bold"
        >
          <span>Explore All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {callouts.length === 0 && (
          <div className="py-4 text-center text-xs text-zinc-500">
            Fetching live Solana alpha callouts…
          </div>
        )}
        {callouts.map((item: any) => {
          const id = item.calloutId || item.coinMint;
          const upvoteCount = (item.upvotes || 0) + (upvotes[id] || 0);
          const mult = item.multiple || 1;
          const symbol = item.coinSymbol || (item.coinMint ? item.coinMint.slice(0, 4).toUpperCase() : "TOKEN");
          const name = item.coinName || "Solana Token";
          const caller = item.callerLabel || (item.userId ? `${item.userId.slice(0, 4)}…${item.userId.slice(-4)}` : "Verified Caller");

          return (
            <div
              key={id}
              onClick={() => {
                if (onSelectToken) onSelectToken(item.coinMint, symbol, name);
              }}
              className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-white/5 hover:border-amber-500/30 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <TokenLogo src={item.mediaUrl} symbol={symbol} size="sm" />
                  <div className="min-w-0">
                    <span className="font-extrabold text-amber-500 dark:text-amber-400 group-hover:text-amber-300 block truncate">
                      ${symbol}
                    </span>
                    <span className="text-[11px] text-zinc-500 block truncate">{name}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                  +{Math.round((mult - 1) * 100)}% ({mult.toFixed(2)}x)
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <CallerAvatar avatarUrl={item.callerAvatarUrl} name={caller} size="sm" className="w-4 h-4 rounded-full" />
                  <span>By @{caller}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleUpvote(id, e)}
                    className="flex items-center gap-1 hover:text-amber-400 transition-colors p-1"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{upvoteCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectToken) onSelectToken(item.coinMint, symbol, name);
                    }}
                    className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[10px] uppercase tracking-wider"
                  >
                    Swap
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LiveCalloutsFeed;
