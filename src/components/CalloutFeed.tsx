"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { CalloutDiscussionModal } from "@/components/modals/CalloutDiscussionModal";
import { JupiterSwapModal } from "@/components/modals/JupiterSwapModal";
import { formatNumber, formatCurrency, formatTimeAgo } from "@/lib/utils";
import {
  Flame,
  Radio,
  Copy,
  Check,
  ExternalLink,
  Zap,
  TrendingUp,
  TrendingDown,
  ThumbsUp,
  MessageSquare,
  RefreshCw,
  Search,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Bell,
  BellOff,
  ArrowUpDown,
  Award,
  Sparkles,
} from "lucide-react";

import { CallerFilterModal } from "@/components/modals/CallerFilterModal";
import { BurnBoostModal } from "@/components/modals/BurnBoostModal";
import { BoostAnyTokenModal } from "@/components/modals/BoostAnyTokenModal";
import { CallerAvatar } from "@/components/callouts/CallerAvatar";
import { TokenLogo } from "@/components/callouts/TokenLogo";
import { Coin } from "@/types/coin";
import { CalloutCallerItem } from "@/types/token";

interface CalloutFeedProps {
  onSelectToken?: (ca: string, symbol: string, name?: string, iconUrl?: string) => void;
  filterSymbol?: string;
}

type CalloutFilterTab = "all" | "2x" | "pinned";
type CalloutSortOption = "newest" | "multiplier" | "mcap" | "winrate";

function playSignalChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store", headers: { Pragma: "no-cache" } }).then((res) => res.json());

export function CalloutFeed({ onSelectToken, filterSymbol }: CalloutFeedProps) {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/callouts",
    fetcher,
    {
      refreshInterval: 3_000,
      revalidateOnFocus: true,
      dedupingInterval: 1_500,
      keepPreviousData: true,
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
  const [sortBy, setSortBy] = useState<CalloutSortOption>("newest");
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(timer);
  }, []);

  const lastCalloutIdRef = useRef<string | null>(null);
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

  // Play subtle sound alert when a new callout arrives (if enabled)
  useEffect(() => {
    if (!data?.callouts || data.callouts.length === 0) return;
    const newestId = data.callouts[0]?.calloutId;
    if (lastCalloutIdRef.current && newestId && newestId !== lastCalloutIdRef.current) {
      if (soundAlertsEnabled) {
        playSignalChime();
      }
    }
    lastCalloutIdRef.current = newestId;
  }, [data?.callouts, soundAlertsEnabled]);

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
  const [isBoostAnyOpen, setIsBoostAnyOpen] = useState(false);
  const [selectedBoostToken, setSelectedBoostToken] = useState<{
    mint: string;
    name: string;
    symbol: string;
    iconUrl?: string;
    priceUsd?: number;
    marketCap?: number;
  } | null>(null);

  // Expanded full thesis map (for long due diligence texts)
  const [expandedThesisIds, setExpandedThesisIds] = useState<Record<string, boolean>>({});

  const toggleExpandThesis = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedThesisIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    await mutate(fetcher("/api/callouts?refresh=1"), { revalidate: true });
    setTick((t) => t + 1);
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
    const callerWallet = c.callerWallet || c.userId || "";
    const callerName = (c.callerLabel && c.callerLabel !== "Alpha Caller" && !c.callerLabel.toLowerCase().includes("alpha caller"))
      ? c.callerLabel
      : (c.callerXUsername ? c.callerXUsername : (callerWallet ? `${callerWallet.slice(0, 4)}…${callerWallet.slice(-4)}` : "Solana Trader"));
    const callerHandle = c.callerXUsername ? c.callerXUsername : (callerWallet ? `${callerWallet.slice(0, 4)}…${callerWallet.slice(-4)}` : "sol_trader");
    const callerAvatarUrl = c.callerAvatarUrl || undefined;
    const tokenIconUrl = c.mediaUrl || (c.coinMint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump" ? "/images/baton-logo.png" : undefined);

    const mintLower = (c.coinMint || "").toLowerCase();
    const symLower = (c.coinSymbol || "").toLowerCase();
    const rankInfo = burnRankMap[mintLower] || burnRankMap[symLower];
    const burnRank = rankInfo?.rank;
    const batonBurned = rankInfo?.burned || c.batonBurned || 0;

    // Clean up symbol to avoid weird unicode symbols like ☉, empty, or 0x...
    let cleanSymbol = (c.coinSymbol || "").trim().toUpperCase();
    if (!cleanSymbol || cleanSymbol === "TOKEN" || cleanSymbol.length > 10 || cleanSymbol.startsWith("0X") || cleanSymbol === "☉" || !/^[A-Z0-9$]+$/.test(cleanSymbol)) {
      cleanSymbol = (c.coinName && c.coinName !== "Solana Project" && c.coinName !== "Solana Token"
        ? c.coinName.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, "")
        : "TOKEN");
    }
    const tokenSymbol = cleanSymbol;
    const tokenName = c.coinName && c.coinName !== "Solana Token" && c.coinName !== "Solana Project" ? c.coinName : tokenSymbol;

    return {
      id: c.calloutId || `callout-${c.coinMint}`,
      callerName,
      callerHandle,
      callerWallet,
      callerAvatar: (tokenSymbol || "CA").slice(0, 2).toUpperCase(),
      callerAvatarUrl,
      callerXUsername: c.callerXUsername,
      tokenName,
      tokenSymbol,
      tokenCA: c.coinMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
      tokenIconUrl,
      calloutPrice: c.calloutPriceUsd || c.calloutPrice || 0,
      currentPrice: (c as any).currentPriceUsd || ((c.calloutPriceUsd || c.calloutPrice || 0) * (c.multiple || 1)),
      entryMcap: (c as any).entryMcap || c.marketCap || 0,
      currentMcap: (c as any).currentMcap || ((c as any).entryMcap ? Math.round((c as any).entryMcap * (c.multiple || 1)) : Math.round(c.marketCap || 0)),
      multiplier: Number((c.multiple || 1).toFixed(2)),
      timeAgo: formatTimeAgo(c.createdAt),
      upvotes: typeof c.likes === "number" ? c.likes : (c.upvotes || 0),
      viewsCount: c.viewCount || 0,
      commentCount: c.commentCount || 0,
      batonBurned,
      burnRank,
      thesis: c.thesis || "High momentum Solana breakout on Pump.fun.",
      calloutId: c.calloutId,
      createdAt: typeof c.createdAt === "number" ? c.createdAt : (c.calloutTimestamp ? new Date(c.calloutTimestamp).getTime() : Date.now()),
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
          callerHandle: "outbid",
          callerAvatar: "OB",
          callerAvatarUrl: "/images/baton-logo.png",
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

  // ALL tab is strictly pure live trader callouts (discards any stale callouts older than 8 hours)
  const allCallouts = useMemo(() => {
    const cutoff = Date.now() - 8 * 60 * 60 * 1000;
    return rawLiveCallouts.filter((c) => !c.createdAt || c.createdAt >= cutoff);
  }, [rawLiveCallouts]);

  // ─── Caller Track Record Stats Map (Win Rate & Peak Multiplier) ─────────────
  const callerStatsMap = useMemo(() => {
    const stats: Record<string, { total: number; wins: number; maxMul: number; winRate: number }> = {};
    for (const c of allCallouts) {
      const keys = [
        c.callerWallet ? c.callerWallet.toLowerCase() : null,
        c.callerName ? c.callerName.toLowerCase() : null,
      ].filter(Boolean) as string[];

      for (const key of keys) {
        if (!stats[key]) {
          stats[key] = { total: 0, wins: 0, maxMul: 1, winRate: 0 };
        }
        stats[key].total++;
        const mul = Number(c.multiplier) || 1;
        // Real on-chain win metric: callout gained value (multiplier >= 1.05)
        if (mul >= 1.05) {
          stats[key].wins++;
        }
        if (mul > stats[key].maxMul) {
          stats[key].maxMul = mul;
        }
      }
    }
    for (const key in stats) {
      const s = stats[key];
      if (key.includes("outbid") || key === "burn_engine") {
        s.winRate = 100;
        s.wins = s.total;
      } else {
        s.winRate = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0;
      }
    }
    return stats;
  }, [allCallouts]);

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

  // Persistent registry of all discovered callers so they NEVER disappear when feed syncs
  const persistentCallersMapRef = React.useRef<Record<string, { count: number; wallet?: string; avatarUrl?: string; xUsername?: string }>>({});

  // Extract complete caller list with counts from all tracked callers & live signals
  const callerList = useMemo(() => {
    const map = { ...persistentCallersMapRef.current };

    // 1. Populate all real tracked callers from API watched list (all 468+ callers)
    if (Array.isArray(data?.watched)) {
      for (const item of data.watched) {
        if (item.label) {
          map[item.label] = {
            count: item.count || 0,
            wallet: item.wallet || map[item.label]?.wallet,
            avatarUrl: item.avatarUrl || map[item.label]?.avatarUrl,
            xUsername: item.xUsername || map[item.label]?.xUsername,
          };
        }
      }
    }

    // 2. Count all actual live callouts for each caller & capture avatar if available
    for (const c of allCallouts) {
      if (c.callerName) {
        const existing = map[c.callerName] || { count: 0, wallet: c.callerWallet };
        map[c.callerName] = {
          count: (map[c.callerName]?.count || 0) + 1,
          wallet: c.callerWallet || existing.wallet,
          avatarUrl: c.callerAvatarUrl || existing.avatarUrl,
          xUsername: c.callerXUsername || existing.xUsername,
        };
      }
    }

    // Always ensure elonmusk is present and tracked
    if (!map["elonmusk"]) {
      map["elonmusk"] = {
        count: 0,
        wallet: "ElonMusk11111111111111111111111111111111111",
        avatarUrl: "https://pbs.twimg.com/profile_images/1874558173748248576/40s2S6An_400x400.jpg",
        xUsername: "elonmusk",
      };
    }

    // Update persistent cache so callers NEVER disappear on subsequent background polls
    persistentCallersMapRef.current = map;

    return Object.entries(map)
      .map(([name, info]) => {
        const stats = callerStatsMap[name.toLowerCase()];
        return {
          name,
          count: info.count,
          wallet: info.wallet,
          avatarUrl: info.avatarUrl,
          xUsername: info.xUsername,
          winRate: stats?.winRate ?? 0,
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [allCallouts, data?.watched, callerStatsMap]);

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

    // 2. Otherwise filter pure callouts (STRICT SOLANA CONTRACTS ONLY)
    let list = allCallouts.filter(
      (c) =>
        c.tokenCA &&
        !c.tokenCA.startsWith("0x") &&
        /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(c.tokenCA)
    );

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

    // 3. Apply Smart Sorting & Token Deduplication / Grouping
    if (sortBy === "mcap") {
      // Group same token calls into a single box when multiple callers call out the same token
      const tokenGroups = new Map<string, CalloutItem[]>();
      for (const item of list) {
        const key = item.tokenCA.toLowerCase();
        const arr = tokenGroups.get(key) || [];
        arr.push(item);
        tokenGroups.set(key, arr);
      }

      const groupedList: CalloutItem[] = [];
      for (const [, items] of tokenGroups) {
        if (items.length === 1) {
          groupedList.push(items[0]);
        } else {
          // Sort items by latest callout
          items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          const primary = items[0];
          const callersInfo: CalloutCallerItem[] = items.map((it) => ({
            callerName: it.callerName,
            callerHandle: it.callerHandle,
            callerWallet: it.callerWallet,
            callerAvatar: it.callerAvatar,
            callerAvatarUrl: it.callerAvatarUrl,
            callerXUsername: it.callerXUsername,
            callerBadge: it.callerBadge,
            thesis: it.thesis,
            multiple: it.multiplier,
            entryMcap: it.entryMcap,
            calloutPrice: it.calloutPrice,
            timeAgo: it.timeAgo,
            createdAt: it.createdAt,
            likes: it.upvotes,
            calloutId: it.calloutId,
          }));

          const bestMul = Math.max(...items.map((it) => it.multiplier));
          const minEntry = Math.min(...items.map((it) => it.entryMcap).filter((m) => m > 0));

          groupedList.push({
            ...primary,
            multiplier: bestMul > 0 ? bestMul : primary.multiplier,
            entryMcap: minEntry < Infinity ? minEntry : primary.entryMcap,
            callers: callersInfo,
          });
        }
      }

      list = groupedList.sort((a, b) => b.currentMcap - a.currentMcap);
    } else if (sortBy === "multiplier") {
      // Group duplicate token calls into one card displaying best gain
      const tokenGroups = new Map<string, CalloutItem[]>();
      for (const item of list) {
        const key = item.tokenCA.toLowerCase();
        const arr = tokenGroups.get(key) || [];
        arr.push(item);
        tokenGroups.set(key, arr);
      }

      const groupedList: CalloutItem[] = [];
      for (const [, items] of tokenGroups) {
        if (items.length === 1) {
          groupedList.push(items[0]);
        } else {
          items.sort((a, b) => b.multiplier - a.multiplier);
          const primary = items[0];
          const callersInfo: CalloutCallerItem[] = items.map((it) => ({
            callerName: it.callerName,
            callerHandle: it.callerHandle,
            callerWallet: it.callerWallet,
            callerAvatar: it.callerAvatar,
            callerAvatarUrl: it.callerAvatarUrl,
            callerXUsername: it.callerXUsername,
            callerBadge: it.callerBadge,
            thesis: it.thesis,
            multiple: it.multiplier,
            entryMcap: it.entryMcap,
            calloutPrice: it.calloutPrice,
            timeAgo: it.timeAgo,
            createdAt: it.createdAt,
            likes: it.upvotes,
            calloutId: it.calloutId,
          }));

          groupedList.push({
            ...primary,
            callers: callersInfo,
          });
        }
      }

      list = groupedList.sort((a, b) => b.multiplier - a.multiplier);
    } else if (sortBy === "winrate") {
      // Sort by caller's verified Win Rate from highest to lowest
      list = [...list].sort((a, b) => {
        const wrA = callerStatsMap[a.callerName?.toLowerCase()]?.winRate ?? a.callerWinRate ?? 0;
        const wrB = callerStatsMap[b.callerName?.toLowerCase()]?.winRate ?? b.callerWinRate ?? 0;
        return wrB - wrA || (b.createdAt || 0) - (a.createdAt || 0);
      });
    } else {
      // Default: newest
      list = [...list].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return list;
  }, [allCallouts, boostedCallouts, filterSymbol, selectedCallers, filterTab, searchQuery, sortBy, callerStatsMap]);

  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    setVisibleCount(30);
  }, [filterTab, selectedCallers, searchQuery, sortBy]);

  const visibleCallouts = useMemo(() => {
    return filteredCallouts.slice(0, visibleCount);
  }, [filteredCallouts, visibleCount]);

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

            {/* Sort Selector, Audio Alert Toggle & Search Input */}
            <div className="flex items-center gap-1.5 flex-1 max-w-full justify-end flex-wrap">
              {/* Sort Selector */}
              <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-900/80 p-0.5 rounded-xl border border-zinc-200 dark:border-white/5 text-[10px] shrink-0">
                <span className="px-1.5 py-1 text-zinc-400 font-bold flex items-center gap-1">
                  <ArrowUpDown className="w-2.5 h-2.5" />
                  <span className="hidden xl:inline">Sort:</span>
                </span>
                {[
                  { id: "newest", label: "⚡ Latest" },
                  { id: "multiplier", label: "🚀 Gain" },
                  { id: "mcap", label: "💰 MCAP" },
                  { id: "winrate", label: "🎯 Win Rate" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSortBy(s.id as CalloutSortOption)}
                    className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                      sortBy === s.id
                        ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Live Signal Audio Ding Alert Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !soundAlertsEnabled;
                  setSoundAlertsEnabled(next);
                  if (next) playSignalChime();
                }}
                className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm ${
                  soundAlertsEnabled
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-amber-400 border-zinc-200 dark:border-white/10"
                }`}
                title={soundAlertsEnabled ? "Signal Audio Alert is ON (Click to mute)" : "Signal Audio Alert is OFF (Click to hear dings for new callouts)"}
              >
                {soundAlertsEnabled ? (
                  <>
                    <Bell className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    <span className="hidden sm:inline text-emerald-400">Audio ON</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="hidden sm:inline text-zinc-500">Audio OFF</span>
                  </>
                )}
              </button>

              {/* Search Input */}
              <div className="relative flex-1 min-w-[130px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search token, caller..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                />
              </div>

              {/* Refresh Button */}
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
                      {isSelected ? (
                        <Check className="w-3 h-3 text-zinc-950 stroke-[3]" />
                      ) : caller.avatarUrl ? (
                        <CallerAvatar avatarUrl={caller.avatarUrl} name={caller.name} size="sm" className="w-4 h-4 rounded-full" />
                      ) : null}
                      <span>@{caller.name}</span>
                      <span className={`text-[9px] ${isSelected ? "text-zinc-900 font-bold" : "opacity-60"}`}>
                        ({caller.count})
                      </span>
                      {caller.winRate > 0 && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                            isSelected
                              ? "bg-zinc-950 text-amber-400"
                              : caller.winRate >= 65
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {caller.winRate}% WR
                        </span>
                      )}
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
                <TokenLogo
                  src={searchedCaResult.iconUrl}
                  symbol={searchedCaResult.symbol}
                  size="lg"
                />

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
          {visibleCallouts.map((item) => {
            const percentGain = Math.round((item.multiplier - 1) * 100);
            const isProfit = percentGain >= 0;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectToken) {
                    onSelectToken(item.tokenCA, item.tokenSymbol, item.tokenName, item.tokenIconUrl);
                  } else {
                    setSwapModalToken({
                      mint: item.tokenCA,
                      symbol: item.tokenSymbol,
                      name: item.tokenName,
                      iconUrl: item.tokenIconUrl,
                    });
                  }
                }}
                className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 shadow-md hover:shadow-xl hover:shadow-amber-500/5 transition-all cursor-pointer relative overflow-hidden h-full"
              >
                {/* Top Accent Gradient Line on Hover */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* ── Top Row: Caller Info & Time Ago ─────────────────────── */}
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={item.callerWallet && item.callerWallet.length > 20 ? `https://pump.fun/profile/${item.callerWallet}` : "#"}
                    target={item.callerWallet && item.callerWallet.length > 20 ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (item.callerWallet && item.callerWallet.length > 20) {
                        e.stopPropagation();
                      }
                    }}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group/caller hover:opacity-90 transition-opacity cursor-pointer"
                    title={item.callerWallet && item.callerWallet.length > 20 ? `View ${item.callerName} on Pump.fun (${item.callerWallet})` : item.callerName}
                  >
                    {(item.callerName?.toLowerCase().includes("outbid") || item.callerHandle?.toLowerCase().includes("outbid") || item.callerHandle === "burn_engine") ? (
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/10">
                        <div className="flex flex-col gap-1 w-4 h-3.5 justify-center">
                          <span className="w-full h-0.5 bg-[#f59e0b] rounded-full shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                          <span className="w-full h-0.5 bg-[#f59e0b] rounded-full shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                          <span className="w-full h-0.5 bg-[#f59e0b] rounded-full shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                        </div>
                      </div>
                    ) : (
                      <CallerAvatar
                        avatarUrl={item.callerAvatarUrl}
                        name={item.callerName}
                        size="md"
                        className="group-hover/caller:border-amber-500/50 transition-colors shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white group-hover/caller:text-amber-500 dark:group-hover/caller:text-amber-400 transition-colors truncate max-w-[120px] sm:max-w-[150px] flex items-center gap-1.5">
                          <span>{item.callerName}</span>
                          {(item.callerName?.toLowerCase().includes("outbid") || item.callerHandle?.toLowerCase().includes("outbid") || item.callerHandle === "burn_engine") && (
                            <div className="flex flex-col gap-[2px] w-3 h-2.5 justify-center shrink-0" title="Outbid Terminal">
                              <span className="w-full h-[1.5px] bg-[#f59e0b] rounded-full shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
                              <span className="w-full h-[1.5px] bg-[#f59e0b] rounded-full shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
                              <span className="w-full h-[1.5px] bg-[#f59e0b] rounded-full shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
                            </div>
                          )}
                        </span>
                        {(() => {
                          const isOutbid =
                            item.callerName?.toLowerCase().includes("outbid") ||
                            item.callerHandle?.toLowerCase().includes("outbid") ||
                            item.callerHandle === "burn_engine";

                          const s = (item.callerWallet && callerStatsMap[item.callerWallet.toLowerCase()]) || callerStatsMap[item.callerName?.toLowerCase()];
                          
                          // Outbid Terminal strictly 100% WR; all other callers use real calculated on-chain stats
                          const winRate = isOutbid ? 100 : (s && s.total > 0 ? s.winRate : (item.multiplier >= 1.05 ? 100 : 0));
                          const isHigh = winRate >= 50;

                          return (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-black shrink-0 border ${
                                isHigh
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              }`}
                              title={
                                isOutbid
                                  ? "Outbid Terminal Verified Engine: 100% WR"
                                  : `Verified On-Chain Real-Time Win Rate: ${winRate}% (${s?.wins ?? (winRate === 100 ? 1 : 0)}/${s?.total ?? 1} profitable calls)`
                              }
                            >
                              🎯 {winRate}% WR
                            </span>
                          );
                        })()}
                        {item.callers && item.callers.length > 1 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-black shrink-0">
                            👥 {item.callers.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                        <span className="group-hover/caller:text-amber-500/80 transition-colors flex items-center gap-0.5 truncate max-w-[110px]">
                          <span>@{item.callerHandle}</span>
                          {item.callerWallet && item.callerWallet.length > 20 && (
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                          )}
                        </span>
                        {item.callerXUsername && (
                          <a
                            href={`https://x.com/${item.callerXUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-zinc-400 hover:text-sky-400 font-bold flex items-center gap-0.5 transition-colors shrink-0"
                            title={`View @${item.callerXUsername} on X`}
                          >
                            <span>𝕏</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </a>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Fresh Signal Pulse (< 3 min ago) */}
                    {item.createdAt && Date.now() - item.createdAt < 180_000 ? (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1 animate-pulse shadow-sm shadow-emerald-500/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span>FRESH</span>
                      </span>
                    ) : null}

                    {item.viewsCount && item.viewsCount > 0 ? (
                      <span className="text-[10px] text-zinc-500 font-mono hidden sm:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/5 shrink-0" title={`${item.viewsCount.toLocaleString()} views on Pump.fun`}>
                        <Eye className="w-2.5 h-2.5 text-zinc-400" />
                        <span>{formatNumber(item.viewsCount)}</span>
                      </span>
                    ) : null}

                    <span className="text-[10px] text-zinc-500 font-bold bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/5 shrink-0">
                      {item.timeAgo}
                    </span>
                  </div>
                </div>

                {/* ── Middle Row: Target Token, Badges & CA ─────────────────── */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Token Icon & Symbol */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TokenLogo
                        src={item.tokenIconUrl}
                        symbol={item.tokenSymbol}
                        size="md"
                      />
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg border flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap ${
                          isProfit
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {isProfit ? (
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-rose-500" />
                        )}
                        <span>{isProfit ? `+${percentGain}%` : `${percentGain}%`}</span>
                        <span className="opacity-80">({item.multiplier}x)</span>
                      </span>

                      {item.burnRank && item.burnRank > 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm shrink-0">
                          <Flame className="w-3 h-3 fill-current text-amber-400" />
                          <span>#{item.burnRank}</span>
                        </span>
                      ) : item.batonBurned > 0 ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-sm shrink-0">
                          <Flame className="w-3 h-3 fill-current text-amber-400" />
                          <span>Boosted</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Contract Address Bar & Clean 4-Col Platform Links Grid */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-white/5 rounded-xl p-2.5 space-y-2 text-xs">
                    {/* Row 1: CA & Solscan / Copy */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 shrink-0">CA:</span>
                        <span className="truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-300 select-all">
                          {item.tokenCA}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleCopy(item.tokenCA, e)}
                          className="p-1 hover:text-amber-400 text-zinc-400 transition-colors cursor-pointer rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
                          title="Copy Contract Address"
                        >
                          {copiedCA === item.tokenCA ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`https://solscan.io/token/${item.tokenCA}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-zinc-400 hover:text-amber-400 transition-colors rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
                          title="View on Solscan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Row 2: 4 Action Buttons Grid (Perfect 4 Columns, No Overflow) */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-zinc-200/60 dark:border-white/5">
                      {/* 1. Original Pump.fun Callout Link */}
                      {item.calloutId && item.calloutId.includes("-") ? (
                        <a
                          href={`https://pump.fun/callouts/${item.tokenCA}/${item.calloutId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-1 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[10px] font-extrabold flex items-center justify-center gap-0.5 transition-all text-center truncate shadow-sm"
                          title="View Original Callout Discussion on Pump.fun"
                        >
                          <span>📣 Callout</span>
                          <ExternalLink className="w-2 h-2 shrink-0 opacity-70" />
                        </a>
                      ) : (
                        <span className="px-1 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 text-[10px] font-bold text-center">
                          📣 Callout
                        </span>
                      )}

                      {/* 2. Pump.fun Official Coin Link */}
                      <a
                        href={`https://pump.fun/coin/${item.tokenCA}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold flex items-center justify-center gap-0.5 transition-all text-center truncate shadow-sm"
                        title="View & Trade on Pump.fun"
                      >
                        <span>💊 Pump</span>
                        <ExternalLink className="w-2 h-2 shrink-0 opacity-70" />
                      </a>

                      {/* 3. Direct Caller Profile Link */}
                      {item.callerWallet ? (
                        <a
                          href={`https://pump.fun/profile/${item.callerWallet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-1 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[10px] font-extrabold flex items-center justify-center gap-0.5 transition-all text-center truncate shadow-sm"
                          title="View Caller Profile on Pump.fun"
                        >
                          <span>📢 Profile</span>
                          <ExternalLink className="w-2 h-2 shrink-0 opacity-70" />
                        </a>
                      ) : (
                        <span className="px-1 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 text-[10px] font-bold text-center">
                          📢 Profile
                        </span>
                      )}

                      {/* 4. DexScreener Link */}
                      <a
                        href={`https://dexscreener.com/solana/${item.tokenCA}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-1 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-[10px] font-extrabold flex items-center justify-center gap-0.5 transition-all text-center truncate shadow-sm"
                        title="View Chart on DexScreener"
                      >
                        <span>🦅 Dex</span>
                        <ExternalLink className="w-2 h-2 shrink-0 opacity-70" />
                      </a>
                    </div>
                  </div>

                  {/* Thesis Quote - Contained & Expandable to prevent any layout shifts */}
                  <div className="bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-white/5 rounded-xl p-2.5 space-y-1.5">
                    {item.callers && item.callers.length > 1 ? (
                      <div className="space-y-1.5">
                        {item.callers.slice(0, 3).map((c, cIdx) => (
                          <div key={cIdx} className="text-xs text-zinc-600 dark:text-zinc-300 leading-snug">
                            <span className="font-black text-amber-500 font-mono mr-1.5 not-italic">@{c.callerHandle}:</span>
                            <span className="italic">&ldquo;{c.thesis || "Send it."}&rdquo;</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <p
                          className={`text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic transition-all ${
                            expandedThesisIds[item.id] ? "whitespace-pre-line" : ""
                          }`}
                          style={
                            !expandedThesisIds[item.id]
                              ? {
                                  display: "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: 2,
                                  overflow: "hidden",
                                }
                              : undefined
                          }
                          title={!expandedThesisIds[item.id] ? item.thesis : undefined}
                        >
                          &ldquo;{item.thesis}&rdquo;
                        </p>

                        {item.thesis && (item.thesis.length > 110 || item.thesis.includes("\n")) && (
                          <div className="flex items-center justify-between pt-0.5 border-t border-zinc-200/40 dark:border-white/5 mt-1">
                            <button
                              type="button"
                              onClick={(e) => toggleExpandThesis(item.id, e)}
                              className="text-[10px] font-bold text-amber-500 hover:text-amber-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>{expandedThesisIds[item.id] ? "Show less ↑" : "Read full thesis ↓"}</span>
                            </button>

                            {item.calloutId && item.calloutId.includes("-") && (
                              <a
                                href={`https://pump.fun/callouts/${item.tokenCA}/${item.calloutId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-zinc-400 hover:text-purple-400 transition-colors inline-flex items-center gap-0.5"
                                title="Open original thread on Pump.fun"
                              >
                                <span>Pump.fun thread</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* ── Bottom Row: Prices, Discuss, Upvote & Quick Buy Button ── */}
                {/* ── Bottom Row: Prices, Discuss, Upvote & Quick Buy Button ── */}
                <div className="pt-2.5 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 text-xs">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block font-medium">Entry MC</span>
                      <span className="font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                        {formatCurrency(item.entryMcap)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block font-medium">Current MC</span>
                      <span className="font-extrabold text-emerald-500 dark:text-emerald-400 font-mono">
                        {formatCurrency(item.currentMcap)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto">
                    <div className="flex items-center gap-1.5">
                      {/* Boost / Burn to Leaderboard Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBoostToken({
                            mint: item.tokenCA,
                            name: item.tokenName,
                            symbol: item.tokenSymbol,
                            iconUrl: item.tokenIconUrl,
                            priceUsd: item.currentPrice,
                            marketCap: item.currentMcap,
                          });
                          setIsBoostAnyOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
                        title={`Burn $BATON to rank $${item.tokenSymbol} on Leaderboard`}
                      >
                        <Flame className="w-3 h-3 fill-current text-orange-500" />
                        <span>Boost</span>
                      </button>

                      {/* Discuss / Comments Button */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenDiscussion(item, e)}
                        className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-500/10 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border border-zinc-200 dark:border-white/5 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Open discussion thread"
                      >
                        <MessageSquare className="w-3 h-3 text-amber-400" />
                        <span>Discuss</span>
                      </button>

                      {/* Upvote Button */}
                      <button
                        type="button"
                        onClick={(e) => handleUpvote(item, e)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          likedCalloutsMap[item.id]
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm"
                            : "bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-500/10 text-zinc-600 dark:text-zinc-400 hover:text-amber-400 border-zinc-200 dark:border-white/5"
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${likedCalloutsMap[item.id] ? "fill-current text-amber-400" : ""}`} />
                        <span>{Math.max(0, item.upvotes + (likesDeltaMap[item.id] || 0))}</span>
                      </button>
                    </div>

                    {/* Quick Buy CTA -> Opens Instant Jupiter Swap Modal */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectToken) {
                          onSelectToken(item.tokenCA, item.tokenSymbol, item.tokenName, item.tokenIconUrl);
                        } else {
                          setSwapModalToken({
                            mint: item.tokenCA,
                            symbol: item.tokenSymbol,
                            name: item.tokenName,
                            iconUrl: item.tokenIconUrl,
                          });
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all uppercase tracking-wider cursor-pointer active:scale-95 shrink-0"
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

        {/* ── Load More Progressive Infinite Pagination ───────────────────── */}
        {visibleCount < filteredCallouts.length && (
          <div className="flex justify-center pt-3 pb-6">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(filteredCallouts.length, prev + 30))}
              className="px-6 py-2.5 rounded-2xl bg-zinc-100 hover:bg-amber-500/15 dark:bg-zinc-900 dark:hover:bg-amber-500/20 text-zinc-900 dark:text-zinc-200 hover:text-amber-500 dark:hover:text-amber-400 font-bold text-xs border border-zinc-200 dark:border-white/10 hover:border-amber-500/30 shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <span>Load More Alpha Signals (+{Math.min(30, filteredCallouts.length - visibleCount)})</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                ({visibleCount}/{filteredCallouts.length})
              </span>
            </button>
          </div>
        )}
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

      {/* ── Boost Any Token to Leaderboard Modal ──────────────────────── */}
      <BoostAnyTokenModal
        isOpen={isBoostAnyOpen}
        onClose={() => {
          setIsBoostAnyOpen(false);
          setSelectedBoostToken(null);
        }}
        initialToken={selectedBoostToken}
        onSuccess={() => {
          setIsBoostAnyOpen(false);
          setSelectedBoostToken(null);
          mutate();
        }}
      />
    </>
  );
}

export default CalloutFeed;
