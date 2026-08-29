"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { CalloutsApiResponse, CalloutCard } from "@/lib/types/callouts";
import { Coin } from "@/types/coin";
import { useTokenMetadataMap } from "@/hooks/useTokenMetadataMap";
import { formatCurrency } from "@/lib/utils";
import {
  Radio,
  Copy,
  Check,
  ExternalLink,
  ArrowUpRight,
  ArrowRight,
  Flame,
} from "lucide-react";

interface LiveCalloutsFeedProps {
  initialCallouts?: CalloutCard[];
  isLoading?: boolean;
  onBoostCoin?: (coin: Coin) => void;
}

const fetcher = (url: string): Promise<CalloutsApiResponse> =>
  fetch(url).then((res) => res.json());

export function LiveCalloutsFeed({
  initialCallouts,
  isLoading: parentLoading = false,
  onBoostCoin,
}: LiveCalloutsFeedProps) {
  const router = useRouter();
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  // Fallback SWR fetch with keepPreviousData to protect against 429 rate limits
  const { data, isLoading: swrLoading } = useSWR<CalloutsApiResponse>(
    initialCallouts && initialCallouts.length > 0 ? null : "/api/callouts",
    fetcher,
    {
      refreshInterval: 90_000,
      dedupingInterval: 45_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 3,
      keepPreviousData: true,
    }
  );

  const callouts: CalloutCard[] = useMemo(() => {
    if (initialCallouts && initialCallouts.length > 0) {
      return initialCallouts.slice(0, 4);
    }
    return (data?.callouts || []).slice(0, 4);
  }, [initialCallouts, data]);

  const calloutMints = useMemo(
    () => callouts.map((c) => c.coinMint),
    [callouts]
  );
  const tokenMetaMap = useTokenMetadataMap(calloutMints);

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

  const handleBoost = (item: CalloutCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const meta = tokenMetaMap[item.coinMint];
    const candidateCoin: Coin = {
      id: item.calloutId,
      name: meta?.name || item.coinMint.slice(0, 8),
      ticker: meta?.symbol || "CALLOUT",
      mintAddress: item.coinMint,
      imageUrl: meta?.imageUrl || item.mediaUrl || undefined,
      iconColor: "#f59e0b",
      marketCap: item.marketCap || 0,
      volume24h: 0,
      change24h: 0,
      sparkline: [10, 12, 14, 13, 16, 18, 20],
      totalBurnedBaton: 0,
      burnLevel: "none",
      description: item.thesis || `Native pump.fun callout by ${item.callerLabel}.`,
    };
    onBoostCoin?.(candidateCoin);
  };

  const handleNavigateToTerminal = (coinMint: string, symbol?: string) => {
    const sym = symbol || "SOL";
    router.push(`/terminal?token=${coinMint}&outputMint=${coinMint}&outputSymbol=${sym}`);
  };

  return (
    <section className="w-full bg-zinc-900/60 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden font-mono space-y-4">
      {/* Ambient glow in corner */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-amber-400 uppercase tracking-wider">
              TRACKED CALLER SIGNALS
            </h2>
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 text-[10px] text-zinc-400 font-medium">
              LIVE STREAM
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-space">
            Real-time watchlist callouts from top-performing Pump.fun wallets.
          </p>
        </div>

        <Link
          href="/callouts"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shrink-0 tracking-wider"
        >
          <span>VIEW ALL CALLOUTS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Dynamic Grid */}
      <div className="relative z-10">
        {isLoading && callouts.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-48 rounded-xl bg-zinc-950/80 border border-white/5 animate-pulse p-4 space-y-3"
              >
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-zinc-800 rounded" />
                  <div className="h-3 w-12 bg-zinc-800 rounded" />
                </div>
                <div className="h-8 bg-zinc-800/40 rounded" />
                <div className="h-10 bg-zinc-800/60 rounded" />
              </div>
            ))}
          </div>
        ) : callouts.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-white/5 bg-zinc-950/40">
            <p className="text-xs text-zinc-400">
              Waiting for next tracked wallet callout signal.
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Callers operate on a 6-hour cooldown.{" "}
              <Link href="/callouts" className="underline hover:text-amber-400 transition-colors">
                View caller watchlist →
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {callouts.map((item) => {
              const meta = tokenMetaMap[item.coinMint];
              const shortMint = `${item.coinMint.slice(0, 4)}...${item.coinMint.slice(-4)}`;

              return (
                <div
                  key={item.calloutId}
                  onClick={() => handleNavigateToTerminal(item.coinMint, meta?.symbol)}
                  className="bg-zinc-950/90 border border-white/10 hover:border-amber-500/40 transition-all rounded-xl p-3.5 shadow-lg flex flex-col justify-between gap-2.5 group cursor-pointer"
                >
                  {/* Top: Caller Handle + Time Ago */}
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/callouts?caller=${encodeURIComponent(item.callerLabel)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 min-w-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[9px] font-bold text-amber-300 shrink-0 uppercase">
                        {item.callerLabel.slice(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-amber-400 truncate">
                        @{item.callerLabel}
                      </span>
                    </Link>
                    <span className="shrink-0 text-[10px] text-zinc-500">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  {/* Thesis / Caption */}
                  {item.thesis ? (
                    <p className="text-[11px] text-zinc-300 italic line-clamp-2 leading-relaxed min-h-[32px]">
                      &ldquo;{item.thesis}&rdquo;
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-600 italic min-h-[32px]">
                      Verified pump.fun signal
                    </p>
                  )}

                  {/* Token Info Banner */}
                  <div className="flex items-center justify-between gap-1.5 text-[10px] px-2 py-1.5 rounded bg-black/50 border border-white/5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {meta?.imageUrl ? (
                        <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                          <Image
                            src={meta.imageUrl}
                            alt={meta.symbol || "token"}
                            width={16}
                            height={16}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ) : null}
                      {meta?.symbol ? (
                        <span className="font-bold text-white text-xs truncate">
                          ${meta.symbol.toUpperCase()}
                        </span>
                      ) : null}
                      <span className="text-zinc-400 truncate">{shortMint}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.coinMint, e)}
                      className="p-0.5 hover:text-amber-400 text-zinc-500 transition-colors cursor-pointer"
                      title="Copy mint address"
                    >
                      {copiedMint === item.coinMint ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Stats Grid: Entry Mcap + ATH */}
                  <div className="grid grid-cols-2 gap-1.5 p-2 rounded bg-black/40 border border-white/5 text-[10px]">
                    <div>
                      <div className="text-zinc-500 uppercase">Entry Mcap</div>
                      <div className="font-bold text-zinc-200 text-xs truncate">
                        {item.marketCap > 0 ? formatCurrency(item.marketCap) : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500 uppercase">ATH Multiplier</div>
                      <div className="font-bold text-amber-400 text-xs">
                        {item.maxMultiplier > 0 ? `${item.maxMultiplier.toFixed(2)}x` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Boost + Pump.fun + DEX */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={(e) => handleBoost(item, e)}
                      className="flex-1 py-1 rounded bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-[10px] flex items-center justify-center gap-1 transition-all uppercase tracking-wider cursor-pointer"
                    >
                      <Flame className="w-3 h-3 fill-current" />
                      <span>Boost</span>
                    </button>
                    <a
                      href={`https://pump.fun/coin/${item.coinMint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                      title="View on Pump.fun"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://dexscreener.com/solana/${item.coinMint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                      title="View on DexScreener"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default LiveCalloutsFeed;
