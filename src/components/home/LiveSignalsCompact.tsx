"use client";

import React, { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { CalloutsApiResponse, CalloutCard } from "@/lib/types/callouts";
import { formatCurrency } from "@/lib/utils";
import { Copy, Check, ArrowRight, Radio } from "lucide-react";

interface LiveSignalsCompactProps {
  initialCallouts?: CalloutCard[];
  isLoading?: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LiveSignalsCompact({
  initialCallouts,
  isLoading: parentLoading = false,
}: LiveSignalsCompactProps) {
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  // If initialCallouts provided from useHomeData, use them; otherwise fetch from /api/callouts
  const { data, isLoading: swrLoading } = useSWR<CalloutsApiResponse>(
    initialCallouts && initialCallouts.length > 0 ? null : "/api/callouts",
    fetcher,
    {
      refreshInterval: 90_000,
      dedupingInterval: 45_000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const callouts: CalloutCard[] =
    initialCallouts && initialCallouts.length > 0
      ? initialCallouts.slice(0, 3)
      : (data?.callouts || []).slice(0, 3);

  const isLoading = parentLoading || (swrLoading && callouts.length === 0);

  const handleCopy = (mint: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const formatTimeAgo = (ts: number): string => {
    if (!ts) return "—";
    const diff = Math.max(0, Date.now() - ts);
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${d}d ago`;
  };

  return (
    <div className="w-full bg-zinc-900/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3 font-mono shadow-lg select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 uppercase tracking-wider">
          <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span>LIVE CALLER PULSE</span>
        </div>
        <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5 font-medium">
          6H COOLDOWN
        </span>
      </div>

      {/* Signals List */}
      <div className="space-y-2">
        {isLoading && callouts.length === 0 ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/5 animate-pulse space-y-1.5"
            >
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-zinc-800 rounded" />
                <div className="h-3 w-12 bg-zinc-800 rounded" />
              </div>
              <div className="h-2.5 w-32 bg-zinc-800/60 rounded" />
            </div>
          ))
        ) : callouts.length === 0 ? (
          <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/5 text-center text-zinc-500 text-xs py-5">
            Waiting for next caller signal.
          </div>
        ) : (
          callouts.map((item) => {
            const shortMint = `${item.coinMint.slice(0, 4)}...${item.coinMint.slice(-4)}`;

            return (
              <div
                key={item.calloutId}
                className="p-2.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-950 border border-white/5 hover:border-amber-500/30 transition-all flex flex-col gap-1.5 group"
              >
                {/* Top: Caller + Time */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 truncate max-w-[140px]">
                    @{item.callerLabel}
                  </span>
                  <span className="text-[10px] text-zinc-500 shrink-0">
                    {formatTimeAgo(item.createdAt)}
                  </span>
                </div>

                {/* Bottom: CA Copy + Entry MC */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">CA:</span>
                    <span className="text-zinc-300">{shortMint}</span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.coinMint, e)}
                      className="p-0.5 hover:text-amber-400 transition-colors"
                      title="Copy CA"
                    >
                      {copiedMint === item.coinMint ? (
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                    </button>
                  </div>

                  <div className="text-[10px] font-bold text-zinc-200">
                    {item.marketCap > 0 ? formatCurrency(item.marketCap) : "—"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Link */}
      <Link
        href="/callouts"
        className="text-[11px] font-bold text-amber-400/90 hover:text-amber-300 flex items-center justify-between pt-1 group transition-colors"
      >
        <span>VIEW ALL TRACKED CALLERS</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

export default LiveSignalsCompact;
