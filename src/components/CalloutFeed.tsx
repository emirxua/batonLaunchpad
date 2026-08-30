"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { CalloutItem } from "@/types/token";
import { SubmitCalloutModal } from "@/components/modals/SubmitCalloutModal";
import { CalloutDiscussionModal } from "@/components/modals/CalloutDiscussionModal";
import { formatNumber, formatCurrency } from "@/lib/utils";
import {
  Flame,
  Radio,
  Copy,
  Check,
  ExternalLink,
  Zap,
  TrendingUp,
  ThumbsUp,
  PlusCircle,
  MessageSquare,
  RefreshCw,
  Search,
  Users,
  Filter,
} from "lucide-react";

interface CalloutFeedProps {
  onSelectToken?: (ca: string, symbol: string, name?: string, iconUrl?: string) => void;
  filterSymbol?: string;
}

type CalloutFilterTab = "all" | "2x" | "whitelist" | "pinned";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CalloutFeed({ onSelectToken, filterSymbol }: CalloutFeedProps) {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/callouts",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  );

  const [filterTab, setFilterTab] = useState<CalloutFilterTab>("all");
  const [selectedCaller, setSelectedCaller] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCA, setCopiedCA] = useState<string | null>(null);
  const [upvotedMap, setUpvotedMap] = useState<Record<string, number>>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedDiscussionCallout, setSelectedDiscussionCallout] = useState<CalloutItem | null>(null);
  const [userCreatedCallouts, setUserCreatedCallouts] = useState<CalloutItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopy = (ca: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ca);
    setCopiedCA(ca);
    setTimeout(() => setCopiedCA(null), 2000);
  };

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvotedMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handleNewCallout = (newCallout: CalloutItem) => {
    setUserCreatedCallouts((prev) => [newCallout, ...prev]);
  };

  const handleOpenDiscussion = (callout: CalloutItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDiscussionCallout(callout);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const rawLiveCallouts: CalloutItem[] = (data?.callouts || []).map((c: any) => {
    const callerName = c.callerLabel || (c.userId ? `${c.userId.slice(0, 4)}…${c.userId.slice(-4)}` : "Verified Caller");
    const callerHandle = c.callerWallet ? `${c.callerWallet.slice(0, 4)}…${c.callerWallet.slice(-4)}` : "sol_trader";
    const avatarSeed = encodeURIComponent(callerName || callerHandle);
    const callerAvatarUrl = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    const tokenIconUrl = c.mediaUrl || (c.coinMint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump" ? "/images/baton-logo.png" : undefined);

    return {
      id: c.calloutId || `callout-${c.coinMint}`,
      callerName,
      callerHandle,
      callerAvatar: (c.coinSymbol || "CA").slice(0, 2).toUpperCase(),
      callerAvatarUrl,
      callerBadge: c.isWatched || ["slingoor", "archelon", "croakie", "cupseyyyyy"].includes(c.callerLabel) ? "Top Whitelist" : "Alpha Node",
      tokenName: c.coinName || "Solana Token",
      tokenSymbol: c.coinSymbol || (c.coinMint ? c.coinMint.slice(0, 4).toUpperCase() : "TOKEN"),
      tokenCA: c.coinMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
      tokenIconUrl,
      calloutPrice: c.calloutPriceUsd || c.calloutPrice || 0,
      currentPrice: (c.calloutPriceUsd || 0) * (c.multiple || 1),
      entryMcap: c.marketCap || 0,
      currentMcap: Math.round((c.marketCap || 0) * (c.multiple || 1)),
      multiplier: Number((c.multiple || 1).toFixed(2)),
      timeAgo: c.createdAt ? `${Math.max(1, Math.floor((Date.now() - c.createdAt) / 60000))}m ago` : "Live",
      upvotes: c.likes || c.upvotes || 0,
      batonBurned: c.batonBurned || 0,
      thesis: c.thesis || "High momentum Solana volume breakout.",
    };
  });

  const allCallouts = [...userCreatedCallouts, ...rawLiveCallouts];

  // Extract unique caller list with counts
  const callerList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of allCallouts) {
      if (c.callerName) {
        counts[c.callerName] = (counts[c.callerName] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allCallouts]);

  // Multi-tier Filter: Tab + Selected Caller + Search Query + Prop Filter
  const filteredCallouts = useMemo(() => {
    let list = allCallouts;

    // Prop filter (e.g. from token details)
    if (filterSymbol) {
      list = list.filter(
        (c) => c.tokenSymbol.toLowerCase() === filterSymbol.toLowerCase()
      );
    }

    // Caller filter
    if (selectedCaller !== "all") {
      list = list.filter(
        (c) => c.callerName.toLowerCase() === selectedCaller.toLowerCase()
      );
    }

    // Tab filter
    if (filterTab === "2x") {
      list = list.filter((c) => c.multiplier >= 2.0);
    } else if (filterTab === "whitelist") {
      list = list.filter((c) => c.callerBadge?.includes("Whitelist") || c.callerBadge?.includes("Pinned"));
    } else if (filterTab === "pinned") {
      list = list.filter((c) => c.batonBurned > 0 || c.callerBadge?.includes("Pinned"));
    }

    // Text search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.tokenSymbol.toLowerCase().includes(q) ||
          c.tokenName.toLowerCase().includes(q) ||
          c.tokenCA.toLowerCase().includes(q) ||
          c.callerName.toLowerCase().includes(q) ||
          c.callerHandle.toLowerCase().includes(q) ||
          c.thesis.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allCallouts, filterSymbol, selectedCaller, filterTab, searchQuery]);

  return (
    <>
      <div className="w-full space-y-4 font-mono select-none">
        {/* ── Feed Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            </span>
            <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-rose-500" />
              <span>LIVE SOLANA ALPHA CALLOUTS</span>
            </h2>
            <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 px-2 py-0.5 rounded-full font-bold">
              {filteredCallouts.length} Signals
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border border-zinc-200 dark:border-white/10 transition-colors cursor-pointer"
              title="Refresh Callouts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            </button>

            {/* Share Alpha / Post Callout Button */}
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all uppercase tracking-wider cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post Callout</span>
            </button>
          </div>
        </div>

        {/* ── Filtering & Search Controls Bar ────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-3.5 space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-white/5 text-xs overflow-x-auto">
              {[
                { id: "all", label: "ALL SIGNALS", count: allCallouts.length },
                {
                  id: "2x",
                  label: "🔥 2X+ GAINS",
                  count: allCallouts.filter((c) => c.multiplier >= 2.0).length,
                },
                {
                  id: "whitelist",
                  label: "👑 WHITELIST",
                  count: allCallouts.filter((c) => c.callerBadge?.includes("Whitelist")).length,
                },
                {
                  id: "pinned",
                  label: "⚡ BOOSTED",
                  count: allCallouts.filter((c) => c.batonBurned > 0).length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id as CalloutFilterTab)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                    filterTab === tab.id
                      ? "bg-amber-500 text-zinc-950 shadow-sm"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search token, symbol, caller or CA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none font-mono"
              />
            </div>
          </div>

          {/* Caller Pills Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 shrink-0 mr-1">
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>CALLERS:</span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCaller("all")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                selectedCaller === "all"
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border border-zinc-200 dark:border-white/5"
              }`}
            >
              All ({allCallouts.length})
            </button>

            {callerList.map((caller) => (
              <button
                key={caller.name}
                type="button"
                onClick={() => setSelectedCaller(caller.name)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  selectedCaller === caller.name
                    ? "bg-amber-500 text-zinc-950 font-extrabold shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border border-zinc-200 dark:border-white/5"
                }`}
              >
                <span>{caller.name}</span>
                <span className="opacity-70">({caller.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filteredCallouts.length === 0 && (
          <div className="py-12 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 text-center text-xs text-zinc-500 font-mono">
            {isLoading ? "Fetching live Solana alpha signals…" : "No callouts matching current filters."}
          </div>
        )}

        {/* ── Callout Cards Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCallouts.map((item: CalloutItem) => {
            const upvoteCount = item.upvotes + (upvotedMap[item.id] || 0);
            const percentGain = Math.round((item.multiplier - 1) * 100);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectToken) {
                    onSelectToken(item.tokenCA, item.tokenSymbol, item.tokenName, item.tokenIconUrl);
                  }
                }}
                className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-lg hover:shadow-xl hover:shadow-amber-500/5 transition-all cursor-pointer relative overflow-hidden"
              >
                {/* Top Accent Gradient Line on Hover */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* ── Top Row: Caller Info & Time Ago ─────────────────────── */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-200 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                      {item.callerAvatarUrl ? (
                        <img
                          src={item.callerAvatarUrl}
                          alt={item.callerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-black text-amber-400 text-xs">
                          {item.callerAvatar}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white truncate">
                          {item.callerName}
                        </span>
                        {item.callerBadge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider shrink-0">
                            {item.callerBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 block truncate">
                        @{item.callerHandle}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-zinc-500 font-bold bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-white/5 shrink-0">
                    {item.timeAgo}
                  </span>
                </div>

                {/* ── Middle Row: Target Token, Badges & CA ─────────────────── */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Token Icon & Symbol */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-200 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 text-xs font-bold text-amber-400 shadow-sm relative">
                        {item.tokenIconUrl ? (
                          <img
                            src={item.tokenIconUrl}
                            alt={item.tokenSymbol}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                            className="w-full h-full object-cover z-10 relative"
                          />
                        ) : null}
                        <span className="font-bold text-amber-400 text-[10px] absolute">
                          ${item.tokenSymbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-base sm:text-lg font-black text-amber-500 dark:text-amber-400 tracking-wide group-hover:text-amber-300 transition-colors block truncate">
                          ${item.tokenSymbol}
                        </span>
                        <span className="text-[11px] text-zinc-500 truncate block">
                          {item.tokenName}
                        </span>
                      </div>
                    </div>

                    {/* Multiplier Badge & Burned Boost */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                        <TrendingUp className="w-3 h-3" />
                        +{percentGain}% ({item.multiplier}x)
                      </span>

                      {item.batonBurned > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-500 dark:text-orange-400 border border-orange-500/30 flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-current text-orange-500" />
                          {formatNumber(item.batonBurned)} $BATON
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contract Address Bar & Direct Platform Links */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold text-zinc-400">CA:</span>
                      <span className="truncate max-w-[130px] sm:max-w-[180px] font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                        {item.tokenCA}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(item.tokenCA, e)}
                        className="p-1 hover:text-amber-400 text-zinc-400 transition-colors cursor-pointer"
                        title="Copy CA"
                      >
                        {copiedCA === item.tokenCA ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Pump.fun Official Link */}
                      <a
                        href={`https://pump.fun/coin/${item.tokenCA}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1 transition-all"
                        title="View & Trade on Pump.fun"
                      >
                        <span>💊 Pump.fun</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      {/* DexScreener Link */}
                      <a
                        href={`https://dexscreener.com/solana/${item.tokenCA}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1 transition-all"
                        title="View Chart on DexScreener"
                      >
                        <span>🦅 Dex</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>

                      {/* Solscan Link */}
                      <a
                        href={`https://solscan.io/token/${item.tokenCA}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-zinc-400 hover:text-amber-400 transition-colors"
                        title="View on Solscan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Thesis */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed italic">
                    &ldquo;{item.thesis}&rdquo;
                  </p>
                </div>

                {/* ── Bottom Row: Prices, Discuss, Upvote & Quick Buy Button ── */}
                <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block">Entry MC</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {formatCurrency(item.entryMcap)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block">Current MC</span>
                      <span className="font-extrabold text-emerald-500 dark:text-emerald-400">
                        {formatCurrency(item.currentMcap)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Discuss / Comments Button */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenDiscussion(item, e)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-500/10 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border border-zinc-200 dark:border-white/5 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Open discussion thread"
                    >
                      <MessageSquare className="w-3 h-3 text-amber-400" />
                      <span>Discuss</span>
                    </button>

                    {/* Upvote Button */}
                    <button
                      type="button"
                      onClick={(e) => handleUpvote(item.id, e)}
                      className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-500/10 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border border-zinc-200 dark:border-white/5 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{upvoteCount}</span>
                    </button>

                    {/* Quick Buy CTA */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectToken) {
                          onSelectToken(item.tokenCA, item.tokenSymbol, item.tokenName, item.tokenIconUrl);
                        }
                        const el = document.getElementById("quick-swap-container");
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                          el.classList.add("ring-2", "ring-amber-500", "transition-all");
                          setTimeout(() => {
                            el.classList.remove("ring-2", "ring-amber-500");
                          }, 1500);
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1 shadow-sm transition-all uppercase tracking-wider cursor-pointer active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Quick Buy</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Submit Callout Modal ────────────────────────────────────────── */}
      <SubmitCalloutModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmitSuccess={handleNewCallout}
      />

      {/* ── Callout Discussion Forum Modal ──────────────────────────────── */}
      {selectedDiscussionCallout && (
        <CalloutDiscussionModal
          callout={selectedDiscussionCallout}
          isOpen={!!selectedDiscussionCallout}
          onClose={() => setSelectedDiscussionCallout(null)}
        />
      )}
    </>
  );
}

export default CalloutFeed;
