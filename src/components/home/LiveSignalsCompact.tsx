"use client";

import React from "react";
import Link from "next/link";
import useSWR from "swr";
import { Radio, ArrowRight, TrendingUp } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LiveSignalsCompact() {
  const { data } = useSWR("/api/callouts", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  });

  const raw = data?.callouts || [];
  const callouts = raw.slice(0, 3);

  return (
    <div className="w-full bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-white/10 p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
          <h3 className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
            Live Signals
          </h3>
        </div>
        <Link href="/callouts" className="text-[10px] text-amber-500 font-bold hover:underline flex items-center gap-0.5">
          <span>View All</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {callouts.length === 0 && (
          <div className="py-2 text-[11px] text-zinc-500 text-center">
            Monitoring live Solana signals…
          </div>
        )}
        {callouts.map((item: any) => {
          const mult = item.multiple || 1;
          const symbol = item.coinSymbol || (item.coinMint ? item.coinMint.slice(0, 4).toUpperCase() : "TOKEN");
          const caller = item.callerLabel || (item.userId ? `${item.userId.slice(0, 4)}…${item.userId.slice(-4)}` : "Verified Caller");

          return (
            <div key={item.calloutId || item.coinMint} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">${symbol}</span>
                <span className="text-[10px] text-zinc-500">by {caller}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                +{Math.round((mult - 1) * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LiveSignalsCompact;
