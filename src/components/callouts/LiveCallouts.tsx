"use client";

import React, { useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import {
  CalloutsApiResponse,
  CalloutCard,
  TopCaller,
} from "@/lib/types/callouts";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Radio,
  RefreshCw,
  ExternalLink,
  Flame,
  Zap,
  Copy,
  Check,
  Trophy,
  Award,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Lock,
  ArrowUpRight,
  Eye,
  MessageSquare,
} from "lucide-react";

const BATON_MINT =
  process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS ||
  "6Hebn672FvMSq61mo4HYq86QgLHgBUm6y8A9bXGppump";

const fetcher = async (url: string): Promise<CalloutsApiResponse> => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok && !data.callouts) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    (error as unknown as { response: CalloutsApiResponse }).response = data;
    throw error;
  }
  return data;
};

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return "Just now";
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

interface LiveCalloutsProps {
  onBoostCoin?: (mint: string, name: string, symbol: string) => void;
}

export const LiveCallouts: React.FC<LiveCalloutsProps> = ({ onBoostCoin }) => {
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const { data, error, isLoading, isValidating, mutate } = useSWR<CalloutsApiResponse>(
    "/api/callouts",
    fetcher,
    {
      refreshInterval: 12000,
      keepPreviousData: true,
      revalidateOnFocus: true,
    }
  );

  const handleCopy = (text: string, type: "mint" | "wallet") => {
    navigator.clipboard.writeText(text);
    if (type === "mint") {
      setCopiedMint(text);
      setTimeout(() => setCopiedMint(null), 2000);
    } else {
      setCopiedWallet(text);
      setTimeout(() => setCopiedWallet(null), 2000);
    }
  };

  const callouts = data?.callouts || [];
  const topCallers = data?.topCallers || [];
  const watchingCallouts = callouts.filter((c) => c.isWatchlist);
  const otherCallouts = callouts.filter((c) => !c.isWatchlist);

  const isAuthRequired =
    data?.authRequired ||
    error?.message?.includes("PUMPFUN_JWT required") ||
    (error && !data);

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Bar: Live Indicator, Clock, Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Pump.fun Native Callouts Stream
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                6h Cooldown Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Live push calls directly from verified Pump.fun creators &amp; callers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {data?.updatedAt && (
            <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/50">
              <Clock className="w-3 h-3 text-zinc-500" />
              <span>{new Date(data.updatedAt).toLocaleTimeString()}</span>
            </div>
          )}
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Feed"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isValidating ? "animate-spin text-lime-400" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Auth Required / Upstream Warning Banner */}
      {isAuthRequired && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-amber-950/20 to-red-950/40 border border-red-500/30 text-xs font-mono space-y-2 text-zinc-300">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>PUMPFUN_JWT Authentication Required</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Upstream native callout endpoints (<code>/callout/list/:id</code>, <code>/callouts</code>) are protected by Cloudflare and Pump.fun JWT authorization.
          </p>
          <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800 text-[11px] space-y-1">
            <div className="text-amber-400 font-semibold">To enable live authenticated feed:</div>
            <ol className="list-decimal list-inside text-zinc-400 space-y-0.5">
              <li>Log into <a href="https://pump.fun" target="_blank" rel="noreferrer" className="underline text-lime-400">pump.fun</a> on desktop browser</li>
              <li>Open DevTools → Application → LocalStorage / Cookies → Copy JWT token</li>
              <li>Add <code>PUMPFUN_JWT=&lt;token&gt;</code> to your <code>.env.local</code> file and restart server</li>
            </ol>
          </div>
          {data?.errors && data.errors.length > 0 && (
            <div className="text-[10px] text-zinc-500 pt-1">
              Upstream logs: {data.errors.map((e) => `${e.source} (${e.status || "err"}: ${e.message})`).join(" | ")}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Callouts Feed (Left 2 cols) & Leaderboard (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Callout Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section A: Tracked Watchlist (Alon & Alpha callers) */}
          {watchingCallouts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                    <Eye className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider font-mono">
                    Watching Stream (Alon &amp; Alpha Callers)
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {watchingCallouts.length} Active Calls
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {watchingCallouts.map((card) => (
                  <CalloutCardItem
                    key={card.id}
                    card={card}
                    isWatchingSpecial
                    copiedMint={copiedMint}
                    copiedWallet={copiedWallet}
                    onCopy={handleCopy}
                    onBoostCoin={onBoostCoin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section B: Global Public Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-lime-500/20 text-lime-400">
                  <Radio className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">
                  Live Global Callouts Feed
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                {otherCallouts.length} Calls
              </span>
            </div>

            {isLoading && callouts.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800" />
                        <div className="space-y-1.5">
                          <div className="w-24 h-3 bg-zinc-800 rounded" />
                          <div className="w-16 h-2 bg-zinc-800/60 rounded" />
                        </div>
                      </div>
                      <div className="w-14 h-5 bg-zinc-800 rounded-full" />
                    </div>
                    <div className="w-full h-12 bg-zinc-800/40 rounded-xl" />
                    <div className="flex justify-between pt-2 border-t border-zinc-800/50">
                      <div className="w-20 h-4 bg-zinc-800 rounded" />
                      <div className="w-16 h-4 bg-zinc-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : otherCallouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherCallouts.map((card) => (
                  <CalloutCardItem
                    key={card.id}
                    card={card}
                    copiedMint={copiedMint}
                    copiedWallet={copiedWallet}
                    onCopy={handleCopy}
                    onBoostCoin={onBoostCoin}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto">
                  <Radio className="w-6 h-6 text-zinc-500" />
                </div>
                <div className="text-zinc-300 font-medium text-sm">
                  {isAuthRequired
                    ? "Authentication required to stream native calls"
                    : "No active push callouts in the last window"}
                </div>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                  Pump.fun native callouts enforce a 6-hour cooldown per caller. As callers push new alerts, they will appear here live.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Top Callers Leaderboard */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    Top Callers Ranking
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Pump.fun Native Caller Performance
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 border border-lime-500/30 font-semibold">
                Rewards Active
              </span>
            </div>

            {topCallers.length > 0 ? (
              <div className="space-y-2.5">
                {topCallers.map((caller) => (
                  <div
                    key={caller.wallet}
                    className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        #{caller.rank}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-100 truncate">
                            {caller.username || `${caller.wallet.slice(0, 4)}...${caller.wallet.slice(-4)}`}
                          </span>
                          {caller.rewardTier === "Diamond" && (
                            <span className="text-[10px] text-cyan-400">💎</span>
                          )}
                          {caller.rewardTier === "Gold" && (
                            <span className="text-[10px] text-amber-400">🥇</span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{caller.totalCalls} Calls</span>
                          {caller.winRate !== undefined && (
                            <span className="text-emerald-400 font-semibold">
                              {caller.winRate}% Win
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopy(caller.wallet, "wallet")}
                      className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                      title="Copy Caller Address"
                    >
                      {copiedWallet === caller.wallet ? (
                        <Check className="w-3 h-3 text-lime-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono space-y-1">
                <Award className="w-6 h-6 mx-auto text-zinc-600 mb-1" />
                <p>Leaderboard syncing from Pump.fun</p>
              </div>
            )}
          </div>

          {/* Promotional Baton Boost Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900 to-lime-500/10 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
              <Flame className="w-4 h-4" />
              <span>$BATON Caller Rewards Engine</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Burn $BATON to outbid and boost your favourite callouts into featured hero placement across all feeds.
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800">
              <span>Token: $BATON</span>
              <a
                href={`https://pump.fun/coin/${BATON_MINT}`}
                target="_blank"
                rel="noreferrer"
                className="text-lime-400 hover:underline flex items-center gap-1"
              >
                <span>View on Pump</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CalloutCardItemProps {
  card: CalloutCard;
  isWatchingSpecial?: boolean;
  copiedMint: string | null;
  copiedWallet: string | null;
  onCopy: (text: string, type: "mint" | "wallet") => void;
  onBoostCoin?: (mint: string, name: string, symbol: string) => void;
}

const CalloutCardItem: React.FC<CalloutCardItemProps> = ({
  card,
  isWatchingSpecial,
  copiedMint,
  copiedWallet,
  onCopy,
  onBoostCoin,
}) => {
  return (
    <div
      className={`p-4 rounded-2xl bg-zinc-900/80 border transition-all duration-300 hover:shadow-lg flex flex-col justify-between gap-3 ${
        isWatchingSpecial
          ? "border-amber-500/40 shadow-amber-500/5 bg-gradient-to-b from-amber-950/20 to-zinc-900/90"
          : card.isBoosted
          ? "border-lime-500/40 shadow-lime-500/5 bg-gradient-to-b from-lime-950/20 to-zinc-900/90"
          : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* 1. Header: Caller Info + Called At + Watchlist Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/30 to-lime-500/30 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-zinc-300">
            {card.callerAvatarUrl ? (
              <Image
                src={card.callerAvatarUrl}
                alt={card.callerUsername || "Caller"}
                width={32}
                height={32}
                className="object-cover"
                unoptimized
              />
            ) : (
              <span>{card.caller.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {card.callerUsername || `${card.caller.slice(0, 4)}...${card.caller.slice(-4)}`}
              </span>
              {card.isWatchlist && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase shrink-0">
                  WATCHING
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
              <span className="truncate">{card.caller.slice(0, 4)}...{card.caller.slice(-4)}</span>
              <button
                onClick={() => onCopy(card.caller, "wallet")}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                title="Copy caller wallet"
              >
                {copiedWallet === card.caller ? (
                  <Check className="w-2.5 h-2.5 text-lime-400" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/50">
            {formatTimeAgo(card.calledAt)}
          </span>
        </div>
      </div>

      {/* 2. Thesis or Callout Message (if present) */}
      {card.thesis && (
        <div className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 font-sans italic flex items-start gap-1.5">
          <MessageSquare className="w-3 h-3 text-zinc-500 shrink-0 mt-0.5" />
          <p className="line-clamp-2">{card.thesis}</p>
        </div>
      )}

      {/* 3. Token Metadata & Image */}
      <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden text-sm font-bold text-zinc-400">
            {card.tokenImageUrl ? (
              <Image
                src={card.tokenImageUrl}
                alt={card.tokenName}
                width={40}
                height={40}
                className="object-cover"
                unoptimized
              />
            ) : (
              <span>{card.tokenSymbol.slice(0, 2)}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-100 truncate">
              {card.tokenName}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
              <span className="text-lime-400 font-bold">${card.tokenSymbol}</span>
              <span>•</span>
              <span className="truncate">{card.mint.slice(0, 4)}...{card.mint.slice(-4)}</span>
              <button
                onClick={() => onCopy(card.mint, "mint")}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                title="Copy mint"
              >
                {copiedMint === card.mint ? (
                  <Check className="w-2.5 h-2.5 text-lime-400" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Multiplier Tag */}
        {card.multiplier > 1.05 && (
          <div className="text-right shrink-0">
            <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5 justify-end">
              <TrendingUp className="w-3 h-3" />
              <span>{card.multiplier}x</span>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono">from call</span>
          </div>
        )}
      </div>

      {/* 4. Financial Stats Grid: Called Mcap vs Current Mcap & 24h Vol */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
          <div className="text-[10px] text-zinc-500">Current Market Cap</div>
          <div className="font-bold text-zinc-200">
            {card.currentMcap > 0 ? formatCurrency(card.currentMcap) : "Tracking..."}
          </div>
          {card.mcapAtCall && (
            <div className="text-[9px] text-zinc-500">
              Call Mcap: {formatCurrency(card.mcapAtCall)}
            </div>
          )}
        </div>

        <div className="p-2 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
          <div className="text-[10px] text-zinc-500">24h Change / Vol</div>
          <div className="flex items-center gap-1 font-bold">
            <span
              className={
                card.priceChange24h >= 0 ? "text-emerald-400" : "text-rose-400"
              }
            >
              {card.priceChange24h >= 0 ? "+" : ""}
              {card.priceChange24h}%
            </span>
          </div>
          <div className="text-[9px] text-zinc-500">
            Vol: {formatCurrency(card.volume24h)}
          </div>
        </div>
      </div>

      {/* 5. Footer Actions: Boost Button + External Links */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
        <button
          onClick={() =>
            onBoostCoin
              ? onBoostCoin(card.mint, card.tokenName, card.tokenSymbol)
              : window.open(
                  `https://pump.fun/coin/${BATON_MINT}`,
                  "_blank"
                )
          }
          className="flex-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Boost with $BATON</span>
        </button>

        <div className="flex items-center gap-1">
          <a
            href={card.dexScreenerUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="View on DexScreener"
          >
            <span className="text-[10px] font-mono font-bold px-1">DEX</span>
          </a>
          <a
            href={card.pumpFunUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-lime-400 hover:text-lime-300 transition-colors"
            title="Trade on Pump.fun"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
