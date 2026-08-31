"use client";

import React, { useState, useMemo, useRef } from "react";
import useSWR from "swr";
import { CalloutDiscussionModal } from "@/components/modals/CalloutDiscussionModal";
import { JupiterSwapModal } from "@/components/modals/JupiterSwapModal";
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
  MessageSquare,
  RefreshCw,
  Search,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { CallerFilterModal } from "@/components/modals/CallerFilterModal";
import { BurnBoostModal } from "@/components/modals/BurnBoostModal";
import { Coin } from "@/types/coin";

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

  const { data: leaderboardData } = useSWR(
    "/api/leaderboard",
    fetcher,
    {
      refreshInterval: 15_000,
      revalidateOnFocus: false,
      dedupingInterval: 8_000,
    }
  );

  const [filterTab, setFilterTab] = useState<CalloutFilterTab>("all");
  const [selectedCallers, setSelectedCallers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCA, setCopiedCA] = useState<string | null>(null);
  const [selectedDiscussionCallout, setSelectedDiscussionCallout] = useState<CalloutItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCallerModalOpen, setIsCallerModalOpen] = useState(false);
  const [swapModalToken, setSwapModalToken] = useState<{
    mint: string;
    symbol: string;
    name?: string;
    iconUrl?: string;
  } | null>(null);
  const [boostModalCoin, setBoostModalCoin] = useState<Coin | null>(null);

  // Dynamic CA Lookup on Search
  const [searchedCaResult, setSearchedCaResult] = useState<{
    mint: string;
    name: string;
    symbol: string;
    iconUrl: string | null;
    priceUsd: number;
    marketCap: number;
  } | null>(null);
  const [isSearchingCa, setIsSearchingCa] = useState(false);

  // Likes tracking & Pump.fun sync prompt state
  const [likedCalloutsMap, setLikedCalloutsMap] = useState<Record<string, boolean>>({});
  const [likesDeltaMap, setLikesDeltaMap] = useState<Record<string, number>>({});
  const [likePromptCallout, setLikePromptCallout] = useState<CalloutItem | null>(null);

  // Always reset to ALL filter tab and clear search when clicking OUTBID logo
  React.useEffect(() => {
    const handleResetToAll = () => {
      setFilterTab("all");
      setSelectedCallers([]);
      setSearchQuery("");
      setSearchedCaResult(null);
    };
    window.addEventListener("outbid:set-tab", handleResetToAll);
    window.addEventListener("outbid:reset-feed", handleResetToAll);
    return () => {
      window.removeEventListener("outbid:set-tab", handleResetToAll);
      window.removeEventListener("outbid:reset-feed", handleResetToAll);
    };
  }, []);


  const callersScrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const scrollCallers = (direction: "left" | "right") => {
    if (callersScrollRef.current) {
      const scrollAmount = 260;
      callersScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!callersScrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - callersScrollRef.current.offsetLeft);
    setScrollLeftState(callersScrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !callersScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - callersScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    callersScrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const toggleCaller = (name: string) => {
    if (name === "all") {
      setSelectedCallers([]);
      return;
    }
    setSelectedCallers((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleCopy = (ca: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ca);
    setCopiedCA(ca);
    setTimeout(() => setCopiedCA(null), 2000);
  };

  const handleUpvote = (callout: CalloutItem, e: React.MouseEvent) => {
    e.stopPropagation();
    // Prompt user with Pump.fun community reaction modal without adding fake local increments
    setLikePromptCallout(callout);
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

  const burnRankMap = useMemo(() => {
    const map: Record<string, { rank: number; burned: number }> = {};
    const list: any[] = leaderboardData?.coins || leaderboardData?.leaderboard || [];
    list.forEach((item, idx) => {
      const rank = idx + 1;
      const burned = item.totalBurnedBaton || item.totalBatonBurned || 0;
      const mint = (item.mintAddress || item.ca || "").toLowerCase();
      const symbol = (item.ticker || item.symbol || "").toLowerCase();
      if (mint) map[mint] = { rank, burned };
      if (symbol) map[symbol] = { rank, burned };
    });
    return map;
  }, [leaderboardData]);

  const rawLiveCallouts: CalloutItem[] = (data?.callouts || []).map((c: any) => {
    const callerName = c.callerLabel || (c.userId ? `${c.userId.slice(0, 4)}…${c.userId.slice(-4)}` : "Verified Caller");
    const callerHandle = c.callerWallet ? `${c.callerWallet.slice(0, 4)}…${c.callerWallet.slice(-4)}` : "sol_trader";
    const avatarSeed = encodeURIComponent(callerName || callerHandle);
    const callerAvatarUrl = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    const tokenIconUrl = c.mediaUrl || (c.coinMint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump" ? "/images/baton-logo.png" : undefined);

    const mintLower = (c.coinMint || "").toLowerCase();
    const symLower = (c.coinSymbol || "").toLowerCase();
    const rankInfo = burnRankMap[mintLower] || burnRankMap[symLower];
    const burnRank = rankInfo?.rank;
    const batonBurned = rankInfo?.burned || c.batonBurned || 0;

    return {
      id: c.calloutId || `callout-${c.coinMint}`,
      callerName,
      callerHandle,
      callerAvatar: (c.coinSymbol || "CA").slice(0, 2).toUpperCase(),
      callerAvatarUrl,
      callerBadge: c.isWatched || ["slingoor", "archelon", "croakie", "cupseyyyyy"].includes(c.callerLabel) ? "Top Whitelist" : "Alpha Node",
      tokenName: c.coinName && c.coinName !== "Solana Token" ? c.coinName : (c.coinSymbol || "Solana Project"),
      tokenSymbol: c.coinSymbol && !c.coinSymbol.startsWith("0x") ? c.coinSymbol.toUpperCase() : (c.coinName ? c.coinName.slice(0, 5).toUpperCase() : "TOKEN"),
      tokenCA: c.coinMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
      tokenIconUrl,
      calloutPrice: c.calloutPriceUsd || c.calloutPrice || 0,
      currentPrice: (c.calloutPriceUsd || 0) * (c.multiple || 1),
      entryMcap: c.marketCap || 0,
      currentMcap: Math.round((c.marketCap || 0) * (c.multiple || 1)),
      multiplier: Number((c.multiple || 1).toFixed(2)),
      timeAgo: c.createdAt ? `${Math.max(1, Math.floor((Date.now() - c.createdAt) / 60000))}m ago` : "Live",
      upvotes: c.likes || c.upvotes || 0,
      batonBurned,
      burnRank,
      thesis: c.thesis || "High momentum Solana volume breakout.",
    };
  });

  const boostedCallouts: CalloutItem[] = useMemo(() => {
    const list: any[] = leaderboardData?.coins || leaderboardData?.leaderboard || [];
    return list
      .filter((coin: any) => (coin.totalBurnedBaton || coin.totalBatonBurned || 0) > 0)
      .map((coin: any, index: number) => {
        const ca = coin.mintAddress || coin.ca || "";
        const symbol = (coin.ticker || coin.symbol || "TOKEN").toUpperCase();
        const name = coin.name || symbol;
        const rank = index + 1;
        const burned = coin.totalBurnedBaton || coin.totalBatonBurned || 0;
        const price = coin.priceUsd || 0;
        const mcap = coin.marketCap || 0;

        return {
          id: `boosted-coin-${ca}`,
          callerName: "Outbid Terminal",
          callerHandle: "burn_engine",
          callerAvatar: "🔥",
          callerAvatarUrl: undefined,
          callerBadge: `Rank #${rank}`,
          tokenName: name,
          tokenSymbol: symbol,
          tokenCA: ca,
          tokenIconUrl: coin.imageUrl || coin.iconUrl || (ca === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump" ? "/images/baton-logo.png" : undefined),
          calloutPrice: price,
          currentPrice: price,
          entryMcap: mcap,
          currentMcap: mcap,
          multiplier: 1.0,
          timeAgo: "Ranked",
          upvotes: 0,
          batonBurned: burned,
          burnRank: rank,
          thesis: `Ranked #${rank} on Burn-to-Rank Leaderboard via verified $BATON burns on Outbid.`,
        };
      });
  }, [leaderboardData]);

  // ALL tab is strictly pure live trader callouts (58 signals)
  const allCallouts = rawLiveCallouts;

  // Check if search query is a Solana Contract Address
  const isInputCA = useMemo(() => {
    const q = searchQuery.trim();
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q);
  }, [searchQuery]);

  // Lookup unlisted CA on Solana to enable instant $BATON burn-to-rank
  React.useEffect(() => {
    if (!isInputCA) {
      setSearchedCaResult(null);
      return;
    }

    const ca = searchQuery.trim();
    const existing = allCallouts.find((c) => c.tokenCA.toLowerCase() === ca.toLowerCase());
    if (existing) {
      setSearchedCaResult(null);
      return;
    }

    let active = true;
    setIsSearchingCa(true);

    fetch(`/api/token-lookup?query=${encodeURIComponent(ca)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data && (data.name || data.symbol)) {
          setSearchedCaResult(data);
        } else {
          setSearchedCaResult(null);
        }
      })
      .catch(() => {
        if (active) setSearchedCaResult(null);
      })
      .finally(() => {
        if (active) setIsSearchingCa(false);
      });

    return () => {
      active = false;
    };
  }, [searchQuery, isInputCA, allCallouts]);

  // Extract unique caller list with counts from live callouts
  const callerList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of allCallouts) {
      if (c.callerName) {
        counts[c.callerName] = (counts[c.callerName] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allCallouts]);

  // Multi-tier Filter: Tab + Multiple Selected Callers + Search Query + Prop Filter
  const filteredCallouts = useMemo(() => {
    // 1. If on BOOSTED tab, show dedicated ranked boosted coins
    if (filterTab === "pinned") {
      let list = boostedCallouts;
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(
          (c) =>
            c.tokenSymbol.toLowerCase().includes(q) ||
            c.tokenName.toLowerCase().includes(q) ||
            c.tokenCA.toLowerCase().includes(q)
        );
      }
      return list;
    }

    // 2. Otherwise filter pure callouts
    let list = allCallouts;

    // Prop filter (e.g. from token details)
    if (filterSymbol) {
      list = list.filter(
        (c) => c.tokenSymbol.toLowerCase() === filterSymbol.toLowerCase()
      );
    }

    // Multiple Callers filter (AND/OR across selected callers)
    if (selectedCallers.length > 0) {
      list = list.filter((c) =>
        selectedCallers.some((sc) => sc.toLowerCase() === c.callerName.toLowerCase())
      );
    }

    // Tab filter
    if (filterTab === "2x") {
      list = list.filter((c) => c.multiplier >= 2.0);
    } else if (filterTab === "whitelist") {
      list = list.filter((c) => c.callerBadge?.includes("Whitelist") || c.callerBadge?.includes("Pinned"));
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
  }, [allCallouts, boostedCallouts, filterSymbol, selectedCallers, filterTab, searchQuery]);

  return (
    <>
      <div className="w-full space-y-3 font-mono select-none">
        {/* ── Filtering & Search Controls Bar ────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-md">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200 dark:border-white/5 text-xs overflow-x-auto no-scrollbar">
              {[
                { id: "all", label: "ALL", count: allCallouts.length },
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
                  count: boostedCallouts.length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id as CalloutFilterTab)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    filterTab === tab.id
                      ? "bg-amber-500 text-zinc-950 shadow-sm font-black"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search Input & Refresh Button */}
            <div className="flex items-center gap-1.5 flex-1 max-w-full sm:max-w-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search token, symbol, caller..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleManualRefresh}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border border-zinc-200 dark:border-white/10 transition-colors cursor-pointer shrink-0"
                title="Refresh Signals"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Caller Filter Toolbar: Directory Button + Smooth Drag Bar */}
          <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              {/* Directory Button (Opens Full Searchable Modal for 100+ Callers) */}
              <button
                type="button"
                onClick={() => setIsCallerModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-400 font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm uppercase tracking-wider active:scale-95"
                title="Browse & Filter All Alpha Callers in Directory Modal"
              >
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Directory</span>
                <span className="bg-amber-500/20 px-1.5 py-0.2 rounded-full text-[10px] text-amber-300 font-mono">
                  {callerList.length}
                </span>
              </button>

              {/* Scroll Left Button */}
              <button
                type="button"
                onClick={() => scrollCallers("left")}
                className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 border border-zinc-200 dark:border-white/10 transition-colors cursor-pointer shrink-0 shadow-sm"
                title="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Ultra-Smooth Drag & Scroll Callers Row with Safe Padding */}
              <div
                ref={callersScrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                onWheel={(e) => {
                  if (e.deltaY) {
                    e.currentTarget.scrollLeft += e.deltaY * 0.9;
                  }
                }}
                className={`flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-1 text-xs select-none scroll-smooth ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
              >
                {/* Multi-Select Caller Pills */}
                {callerList.map((caller) => {
                  const isSelected = selectedCallers.some(
                    (sc) => sc.toLowerCase() === caller.name.toLowerCase()
                  );

                  return (
                    <button
                      key={caller.name}
                      type="button"
                      onClick={() => toggleCaller(caller.name)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 whitespace-nowrap ${
                        isSelected
                          ? "bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20 ring-1 ring-amber-400"
                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 border border-zinc-200 dark:border-white/5"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-zinc-950 stroke-[3]" />}
                      <span>{caller.name}</span>
                      <span className={`text-[9px] ${isSelected ? "text-zinc-900 font-bold" : "opacity-60"}`}>
                        ({caller.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Scroll Right Button */}
              <button
                type="button"
                onClick={() => scrollCallers("right")}
                className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-amber-400 border border-zinc-200 dark:border-white/10 transition-colors cursor-pointer shrink-0 shadow-sm"
                title="Scroll Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active Selected Callers Tag Strip (Ultra-Minimal Pill Bar) */}
            {selectedCallers.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-wider mr-1">
                  Filtering ({selectedCallers.length}):
                </span>
                {selectedCallers.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold text-[10px]"
                  >
                    <span>{name}</span>
                    <button
                      type="button"
                      onClick={() => toggleCaller(name)}
                      className="hover:text-white transition-colors cursor-pointer ml-0.5"
                      title={`Remove ${name}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedCallers([])}
                  className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-rose-500/10 border border-zinc-200 dark:border-white/5 hover:border-rose-500/30 text-[10px] text-zinc-500 hover:text-rose-400 font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Clear all selected callers"
                >
                  <X className="w-2.5 h-2.5" />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Boosted Informative Text (Ultra-Minimal) */}
        {filterTab === "pinned" && (
          <div className="flex items-center gap-2 px-1 text-[11px] text-zinc-500 font-mono select-none">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Ranked by verified on-chain <strong className="text-amber-400 font-medium">$BATON burns</strong> executed on Outbid Terminal.
            </span>
          </div>
        )}

        {/* On-the-fly CA Lookup Result & Burn-to-Rank Card */}
        {searchedCaResult && filteredCallouts.length === 0 && (
          <div className="bg-white dark:bg-zinc-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5 animate-in fade-in duration-150 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Token Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-200 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 text-sm font-bold text-amber-400 shadow-md">
                  {searchedCaResult.iconUrl ? (
                    <img
                      src={searchedCaResult.iconUrl}
                      alt={searchedCaResult.symbol}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>${searchedCaResult.symbol.slice(0, 2)}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-amber-500 dark:text-amber-400">
                      ${searchedCaResult.symbol}
                    </span>
                    <span className="text-xs text-zinc-500 truncate">
                      {searchedCaResult.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span className="truncate max-w-[180px] sm:max-w-[260px] text-[11px] text-zinc-500">
                      {searchedCaResult.mint}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(searchedCaResult.mint, e)}
                      className="p-0.5 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Copy CA"
                    >
                      {copiedCA === searchedCaResult.mint ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`https://pump.fun/coin/${searchedCaResult.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>💊 Pump.fun</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setBoostModalCoin({
                      id: `token-${searchedCaResult.mint}`,
                      name: searchedCaResult.name,
                      ticker: searchedCaResult.symbol,
                      mintAddress: searchedCaResult.mint,
                      imageUrl: searchedCaResult.iconUrl || undefined,
                      priceUsd: searchedCaResult.priceUsd || 0,
                      marketCap: searchedCaResult.marketCap || 0,
                      volume24h: 0,
                      change24h: 0,
                      sparkline: [],
                      totalBurnedBaton: 0,
                      burnLevel: 0,
                      category: "Solana",
                      description: "Boosted on Outbid Terminal",
                      viewsCount: 0,
                    });
                  }}
                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>Burn $BATON to Rank</span>
                </button>
              </div>
            </div>

            {/* Minimalist Info Notice */}
            <div className="pt-2 border-t border-zinc-200 dark:border-white/5 flex items-center gap-2 text-[11px] text-zinc-500">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Not in active caller signals yet. Burn <strong className="text-amber-400 font-medium">$BATON</strong> to enter the Leaderboard and boost this token!
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredCallouts.length === 0 && !searchedCaResult && (
          <div className="py-12 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 text-center text-xs text-zinc-500 font-mono space-y-1.5">
            {isLoading || isSearchingCa ? (
              <p>Fetching live Solana token data…</p>
            ) : filterTab === "pinned" ? (
              <>
                <p className="text-zinc-300 font-bold">No boosted coins yet.</p>
                <p className="text-[11px] text-zinc-500">
                  Burn $BATON via Burn-to-Rank to feature and rank any coin here. Only burns completed on Outbid Terminal are eligible.
                </p>
              </>
            ) : (
              <p>No callouts matching current filters.</p>
            )}
          </div>
        )}

        {/* ── Callout Cards Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCallouts.map((item: CalloutItem) => {
            const upvoteCount = Math.max(0, item.upvotes + (likesDeltaMap[item.id] || 0));
            const percentGain = Math.round((item.multiplier - 1) * 100);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectToken) {
                    onSelectToken(item.tokenCA, item.tokenSymbol, item.tokenName, item.tokenIconUrl);
                  }
                  if (typeof window !== "undefined") {
                    const isPump = item.tokenCA.toLowerCase().endsWith("pump");
                    if (isPump) {
                      window.open(`https://pump.fun/coin/${item.tokenCA}`, "_blank", "noopener,noreferrer");
                    } else {
                      window.open(`https://dexscreener.com/solana/${item.tokenCA}`, "_blank", "noopener,noreferrer");
                    }
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
                      ) : item.callerAvatar === "🔥" ? (
                        <Flame className="w-5 h-5 text-amber-400 fill-current" />
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

                    {/* Multiplier Badge & Burn Rank */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                        <TrendingUp className="w-3 h-3" />
                        +{percentGain}% ({item.multiplier}x)
                      </span>

                      {item.burnRank && item.burnRank > 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                          <Flame className="w-3 h-3 fill-current text-amber-400" />
                          <span>Rank #{item.burnRank}</span>
                        </span>
                      ) : item.batonBurned > 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                          <Flame className="w-3 h-3 fill-current text-amber-400" />
                          <span>Boosted</span>
                        </span>
                      ) : null}
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
                      onClick={(e) => handleUpvote(item, e)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        likedCalloutsMap[item.id]
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm"
                          : "bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-500/10 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border-zinc-200 dark:border-white/5"
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${likedCalloutsMap[item.id] ? "fill-current text-amber-400" : ""}`} />
                      <span>{Math.max(0, item.upvotes + (likesDeltaMap[item.id] || 0))}</span>
                    </button>

                    {/* Quick Buy CTA -> Opens Instant Jupiter Swap Modal */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectToken) {
                          onSelectToken(item.tokenCA, item.tokenSymbol, item.tokenName, item.tokenIconUrl);
                        }
                        setSwapModalToken({
                          mint: item.tokenCA,
                          symbol: item.tokenSymbol,
                          name: item.tokenName,
                          iconUrl: item.tokenIconUrl,
                        });
                      }}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all uppercase tracking-wider cursor-pointer active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Quick Buy</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Callout Discussion Forum Modal ──────────────────────────────── */}
      {selectedDiscussionCallout && (
        <CalloutDiscussionModal
          callout={selectedDiscussionCallout}
          isOpen={!!selectedDiscussionCallout}
          onClose={() => setSelectedDiscussionCallout(null)}
        />
      )}

      {/* ── Direct Jupiter V6 Swap Modal ────────────────────────────────── */}
      {swapModalToken && (
        <JupiterSwapModal
          isOpen={!!swapModalToken}
          onClose={() => setSwapModalToken(null)}
          targetMint={swapModalToken.mint}
          targetSymbol={swapModalToken.symbol}
          targetName={swapModalToken.name}
          targetIconUrl={swapModalToken.iconUrl}
        />
      )}

      {/* ── Alpha Callers Directory Modal ───────────────────────────────── */}
      <CallerFilterModal
        isOpen={isCallerModalOpen}
        onClose={() => setIsCallerModalOpen(false)}
        allCallers={callerList}
        selectedCallers={selectedCallers}
        onToggleCaller={toggleCaller}
        onSelectAll={(callers) => setSelectedCallers(callers)}
        onClearAll={() => setSelectedCallers([])}
      />

      {/* ── Pump.fun Social Like & Sentiment Sync Modal ──────────────────── */}
      {likePromptCallout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-mono select-none">
          <div className="relative w-full max-w-md bg-[#0C0E14] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ThumbsUp className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Pump.fun Reaction Sync
                  </h3>
                  <span className="text-[10px] text-zinc-400">
                    Live Community Callout Signal
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLikePromptCallout(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Token Info & Explanation */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-amber-400">
                  {likePromptCallout.tokenIconUrl ? (
                    <img
                      src={likePromptCallout.tokenIconUrl}
                      alt={likePromptCallout.tokenSymbol}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>${likePromptCallout.tokenSymbol.slice(0, 2)}</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-black text-amber-400 block leading-tight">
                    ${likePromptCallout.tokenSymbol}
                  </span>
                  <span className="text-[11px] text-zinc-400 block">
                    Called by @{likePromptCallout.callerName}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 pt-1 leading-relaxed">
                This callout's likes are synchronized directly from <strong>Pump.fun</strong> thread metrics. 
                Like or reply to this coin thread on Pump.fun and your reaction will be reflected here automatically!
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setLikePromptCallout(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              >
                Dismiss
              </button>

              <button
                type="button"
                onClick={() => {
                  const ca = likePromptCallout.tokenCA;
                  setLikePromptCallout(null);
                  if (typeof window !== "undefined") {
                    window.open(`https://pump.fun/coin/${ca}`, "_blank", "noopener,noreferrer");
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 transition-all uppercase tracking-wider cursor-pointer active:scale-95"
              >
                <span>Like on Pump.fun</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Burn-to-Rank Modal for Looked-up Unlisted Token ─────────────── */}
      {boostModalCoin && (
        <BurnBoostModal
          coin={boostModalCoin}
          isOpen={Boolean(boostModalCoin)}
          onClose={() => setBoostModalCoin(null)}
          onSuccess={() => {
            setBoostModalCoin(null);
            mutate();
          }}
        />
      )}
    </>
  );
}

export default CalloutFeed;
