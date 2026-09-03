import React, { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { TrendingTokenItem } from "@/types/token";
import { JupiterSwapModal } from "@/components/modals/JupiterSwapModal";
import { BoostAnyTokenModal } from "@/components/modals/BoostAnyTokenModal";
import {
  Zap,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Coins,
  AlertTriangle,
  X,
  Flame,
  Star,
} from "lucide-react";

import { TokenChartDrawer, DrawerTokenData } from "@/components/modals/TokenChartDrawer";
import { useWatchlistTokens } from "@/hooks/useWatchlistTokens";

type FilterTab = "all" | "gainers" | "top_volume" | "high_mcap" | "watchlist";

interface TrendingGridProps {
  onSelectToken?: (ca: string, symbol: string, name?: string, iconUrl?: string) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TrendingGrid({ onSelectToken }: TrendingGridProps) {
  const { data, isLoading, mutate } = useSWR(
    "/api/trending",
    fetcher,
    {
      refreshInterval: 5_000,
      revalidateOnFocus: true,
      dedupingInterval: 3_000,
    }
  );

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [copiedCA, setCopiedCA] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [selectedBoostToken, setSelectedBoostToken] = useState<{
    mint: string;
    name: string;
    symbol: string;
    iconUrl?: string;
    priceUsd?: number;
    marketCap?: number;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmNonPumpToken, setConfirmNonPumpToken] = useState<any | null>(null);
  const [drawerToken, setDrawerToken] = useState<DrawerTokenData | null>(null);
  const { isWatchlisted, toggleWatchlist, watchlist, isLoggedIn, authRequiredToast, dismissAuthToast } = useWatchlistTokens();
  const [swapModalToken, setSwapModalToken] = useState<{
    mint: string;
    symbol: string;
    name?: string;
    iconUrl?: string;
    amountSol?: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const handleCopy = (ca: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ca);
    setCopiedCA(ca);
    setTimeout(() => setCopiedCA(null), 2000);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleCardClick = (token: any) => {
    if (onSelectToken) {
      onSelectToken(token.ca, token.symbol, token.name, token.iconUrl);
      return;
    }
    const isPumpCoin =
      token.ca.toLowerCase().endsWith("pump") &&
      !token.dexId.toLowerCase().includes("meteora");

    if (isPumpCoin) {
      if (typeof window !== "undefined") {
        window.open(`https://pump.fun/coin/${token.ca}`, "_blank", "noopener,noreferrer");
      }
    } else {
      // Prompt user confirmation modal before opening non-pump token
      setConfirmNonPumpToken(token);
    }
  };

  // Instant 0ms cached trending tokens for zero page load delay
  const [cachedTokens, setCachedTokens] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("baton_cached_trending_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (data?.tokens && data.tokens.length > 0) {
      try {
        localStorage.setItem("baton_cached_trending_v2", JSON.stringify(data.tokens.slice(0, 60)));
      } catch {}
    }
  }, [data?.tokens]);

  const rawTokens: any[] = (data?.tokens && data.tokens.length > 0) ? data.tokens : (data?.data || cachedTokens);

  const allTokens: any[] = useMemo(() => {
    return rawTokens.map((t: any) => {
      const price = t.priceUsd ?? 0;
      const mcap = t.marketCap ?? t.fdv ?? 0;
      const vol24h = t.volume24h ?? 0;
      const vol6h = t.volume6h ?? (vol24h * 0.35);
      const change24h = t.priceChange24h ?? 0;
      const change6h = t.priceChange6h ?? (change24h * 0.4);
      const age = t.age || "New";
      const liq = t.liquidityUsd ?? 0;
      const dexId = (t.dexId || "raydium").toUpperCase();

      return {
        id: `token-${t.mint || t.ca}`,
        name: t.name || "Solana Token",
        symbol: (t.symbol || "TOKEN").toUpperCase(),
        ca: t.mint || t.ca || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
        price,
        priceFormatted: t.priceFormatted || (price < 0.001 ? `$${price.toFixed(6)}` : `$${price.toFixed(4)}`),
        mcap,
        mcapFormatted: t.mcapFormatted || (mcap >= 1e6 ? `$${(mcap / 1e6).toFixed(1)}M` : `$${(mcap / 1e3).toFixed(0)}K`),
        volume24h: vol24h,
        volumeFormatted: t.volumeFormatted || (vol24h >= 1e6 ? `$${(vol24h / 1e6).toFixed(1)}M` : `$${(vol24h / 1e3).toFixed(0)}K`),
        volume6h: vol6h,
        volume6hFormatted: t.volume6hFormatted || (vol6h >= 1e6 ? `$${(vol6h / 1e6).toFixed(1)}M` : `$${(vol6h / 1e3).toFixed(0)}K`),
        liquidityUsd: liq,
        liquidityFormatted: t.liquidityFormatted || (liq >= 1e6 ? `$${(liq / 1e6).toFixed(1)}M` : `$${(liq / 1e3).toFixed(0)}K`),
        priceChange24h: change24h,
        priceChangeFormatted: t.priceChangeFormatted || `${change24h >= 0 ? "+" : ""}${change24h.toFixed(1)}%`,
        priceChange6h: change6h,
        priceChange6hFormatted: t.priceChange6hFormatted || `${change6h >= 0 ? "+" : ""}${change6h.toFixed(1)}%`,
        age,
        dexId,
        badge: t.badge || (change6h >= 50 ? "6H Breakout" : vol6h >= 500000 ? "Top 6H Vol" : "Trending 6H"),
        iconUrl: t.iconUrl || undefined,
        dexScreenerUrl: t.dexScreenerUrl || `https://dexscreener.com/solana/${t.mint || t.ca}`,
      };
    });
  }, [rawTokens]);

  const filteredTokens = useMemo(() => {
    if (activeTab === "gainers") {
      return [...allTokens].sort((a, b) => (b.priceChange6h || b.priceChange24h) - (a.priceChange6h || a.priceChange24h)).filter((t) => (t.priceChange6h || t.priceChange24h) > 0);
    }
    if (activeTab === "top_volume") {
      return [...allTokens].sort((a, b) => (b.volume6h || b.volume24h) - (a.volume6h || a.volume24h));
    }
    if (activeTab === "high_mcap") {
      return allTokens.filter((t) => t.mcap >= 1_000_000).sort((a, b) => b.mcap - a.mcap);
    }
    if (activeTab === "watchlist") {
      const seen = new Set<string>();
      return allTokens.filter((t) => {
        const ca = (t.ca || "").toLowerCase();
        if (isWatchlisted(t.ca) && !seen.has(ca)) {
          seen.add(ca);
          return true;
        }
        return false;
      });
    }
    return allTokens;
  }, [activeTab, allTokens, isWatchlisted, watchlist]);

  return (
    <section className="w-full space-y-4 font-mono select-none">
      {/* ── Header & Filter Tabs ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
            TRENDING TOKENS
          </h2>
          <span className="text-[10px] text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded font-bold">
            {filteredTokens.length} Tokens
          </span>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-full">
          {/* Scrollable Filter Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-1 text-[11px] overflow-x-auto no-scrollbar scroll-smooth flex-nowrap max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "all"
                  ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              ALL ({allTokens.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("gainers")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "gainers"
                  ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              🔥 GAINERS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("top_volume")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "top_volume"
                  ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              ⚡ TOP VOL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("high_mcap")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "high_mcap"
                  ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              💎 $1M+ MCAP
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("watchlist")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === "watchlist"
                  ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              ⭐ WATCHLIST ({watchlist.length})
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* Burn $BATON to Leaderboard CTA Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedBoostToken(null);
                setIsBoostModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer active:scale-95 transition-all flex-1 sm:flex-initial justify-center"
              title="Burn $BATON to rank any token on the official Leaderboard"
            >
              <Flame className="w-3.5 h-3.5 fill-current text-zinc-950" />
              <span>Burn $BATON to Rank</span>
            </button>

            <button
              type="button"
              onClick={handleManualRefresh}
              title="Refresh Trending Data"
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-amber-400 transition-all cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {filteredTokens.length === 0 && (
        <div className="py-12 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 text-center text-xs text-zinc-500 font-mono space-y-2 p-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
            <Star className="w-6 h-6 fill-current" />
          </div>
          {activeTab === "watchlist" && !isLoggedIn ? (
            <div className="space-y-3 py-2">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                Sign In to Access Watchlist
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Connect your Solana wallet or sign in with Google to view and sync your personal token watchlist across devices.
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("outbid:open-auth-modal"))}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
              >
                Sign In (Google / Wallet)
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase">
                {activeTab === "watchlist" ? "Your Watchlist is Empty" : "No tokens found"}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {activeTab === "watchlist"
                  ? "Click the ⭐ star icon on any token card to add it to your personal radar."
                  : "No tokens matching the selected filter."}
              </p>
              {activeTab === "watchlist" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all uppercase cursor-pointer active:scale-95 shadow-md"
                >
                  Browse All Trending
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Cards Grid (3 Columns) ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTokens.map((token: any) => {
          const isPositive6h = token.priceChange6h >= 0;
          const isPositive24h = token.priceChange24h >= 0;
          const isPump =
            token.ca.toLowerCase().endsWith("pump") &&
            !token.dexId.toLowerCase().includes("meteora");

          return (
            <div
              key={token.id}
              onClick={() => handleCardClick(token)}
              className="group card-virtualized p-4 rounded-2xl border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 bg-white dark:bg-zinc-950 flex flex-col justify-between gap-3 shadow-md hover:shadow-xl hover:shadow-amber-500/5 transition-all cursor-pointer relative overflow-hidden"
            >
              {/* ── Card Header: Logo, Name & Dex / Age Badges ────────────── */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-200 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0 relative text-xs font-bold text-amber-400 shadow-sm">
                    {token.iconUrl ? (
                      <img
                        src={token.iconUrl}
                        alt={token.symbol}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                        className="w-full h-full object-cover z-10 relative"
                      />
                    ) : null}
                    <span className="font-bold text-amber-400 text-[10px] absolute">
                      ${token.symbol.slice(0, 2)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-black text-zinc-900 dark:text-white group-hover:text-amber-400 transition-colors block truncate">
                      ${token.symbol}
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate block">
                      {token.name}
                    </span>
                  </div>
                </div>

                {/* Dex & Age Badges */}
                <div className="flex items-center gap-1 shrink-0">
                  {token.age && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700 font-mono">
                      {token.age}
                    </span>
                  )}
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                    {token.dexId}
                  </span>

                  {/* Star Watchlist Button */}
                  <button
                    type="button"
                    onClick={(e) => toggleWatchlist(token.ca, e)}
                    className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title={isWatchlisted(token.ca) ? "Remove from Watchlist" : "Add to Watchlist"}
                  >
                    <Star
                      className={`w-3.5 h-3.5 transition-colors ${
                        isWatchlisted(token.ca)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-400 hover:text-amber-400"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* ── Metrics Grid: Price, MCAP, 6H, 24H ─────────────────────── */}
              <div className="grid grid-cols-4 gap-1 py-1.5 px-2 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-white/5 text-center">
                <div>
                  <span className="text-[8px] text-zinc-400 font-bold block uppercase">Price</span>
                  <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 truncate block font-mono">
                    {token.priceFormatted}
                  </span>
                </div>

                <div>
                  <span className="text-[8px] text-zinc-400 font-bold block uppercase">MCAP</span>
                  <span className="text-[11px] font-black text-amber-500 dark:text-amber-400 truncate block font-mono">
                    {token.mcapFormatted}
                  </span>
                </div>

                <div>
                  <span className="text-[8px] text-zinc-400 font-bold block uppercase">6H</span>
                  <span
                    className={`text-[11px] font-black truncate block font-mono flex items-center justify-center gap-0.5 ${
                      isPositive6h ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {isPositive6h ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {token.priceChange6hFormatted}
                  </span>
                </div>

                <div>
                  <span className="text-[8px] text-zinc-400 font-bold block uppercase">24H</span>
                  <span
                    className={`text-[11px] font-black truncate block font-mono flex items-center justify-center gap-0.5 ${
                      isPositive24h ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {isPositive24h ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {token.priceChangeFormatted}
                  </span>
                </div>
              </div>

              {/* ── 6H & 24H Volume & Liquidity Row ──────────────────────── */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 font-bold">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-amber-400" />
                  6H Vol: <strong className="text-zinc-200">{token.volume6hFormatted}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-emerald-400" />
                  24H: <strong className="text-zinc-200">{token.volumeFormatted}</strong>
                </span>
              </div>

              {/* ── Actions: 2 Clean Rows, Zero Overflow, Perfect Alignment ─────────── */}
              <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-1.5">
                {/* Row 1: Quick Snipe Presets & Instant Swap */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSwapModalToken({
                        mint: token.ca,
                        symbol: token.symbol,
                        name: token.name,
                        iconUrl: token.iconUrl,
                        amountSol: "0.1",
                      });
                    }}
                    className="py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-500 dark:text-amber-400 font-black text-[10px] flex items-center gap-0.5 transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
                    title="Quick Buy 0.1 SOL with Jupiter"
                  >
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    <span>0.1 SOL</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSwapModalToken({
                        mint: token.ca,
                        symbol: token.symbol,
                        name: token.name,
                        iconUrl: token.iconUrl,
                        amountSol: "0.5",
                      });
                    }}
                    className="py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-500 dark:text-amber-400 font-black text-[10px] flex items-center gap-0.5 transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
                    title="Quick Buy 0.5 SOL with Jupiter"
                  >
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    <span>0.5 SOL</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSwapModalToken({
                        mint: token.ca,
                        symbol: token.symbol,
                        name: token.name,
                        iconUrl: token.iconUrl,
                      });
                    }}
                    className="flex-1 py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all uppercase tracking-wider cursor-pointer active:scale-95"
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Swap</span>
                  </button>
                </div>

                {/* Row 2: Boost, Links (Pump, Dex) & Copy CA */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  {/* Boost to Leaderboard Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBoostToken({
                        mint: token.ca,
                        name: token.name,
                        symbol: token.symbol,
                        iconUrl: token.iconUrl,
                        priceUsd: token.price || token.priceUsd || 0,
                        marketCap: token.mcap || token.marketCap || 0,
                      });
                      setIsBoostModalOpen(true);
                    }}
                    className="py-1 px-2 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 hover:from-amber-500/25 hover:to-orange-500/25 text-amber-500 dark:text-amber-400 border border-amber-500/30 font-extrabold text-[10px] flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                    title={`Burn $BATON to rank $${token.symbol} on Leaderboard`}
                  >
                    <Flame className="w-3 h-3 fill-current text-orange-500" />
                    <span>Boost</span>
                  </button>

                  {/* Links & Copy Group */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Pump.fun Official Coin Link */}
                    <a
                      href={`https://pump.fun/coin/${token.ca}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1 transition-all shadow-sm shrink-0"
                      title="View & Trade on Pump.fun"
                    >
                      <span>💊 Pump</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>

                    {/* DexScreener Link */}
                    <a
                      href={token.dexScreenerUrl || `https://dexscreener.com/solana/${token.ca}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1 transition-all shadow-sm shrink-0"
                      title="View Chart on DexScreener"
                    >
                      <span>🦅 Dex</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                    </a>

                    {/* Copy CA Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopy(token.ca, e)}
                      className="p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                      title="Copy Contract Address"
                    >
                      {copiedCA === token.ca ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Warning Toast Notification for non-Pump.fun coins */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#0E1015] border border-amber-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 font-mono text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span className="flex-1 text-zinc-200">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Confirmation Modal for Meteora / Non-Pump.fun Coins */}
      {confirmNonPumpToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-mono">
          <div className="relative w-full max-w-md bg-[#0C0E14] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Non-Pump.fun Token
                  </h3>
                  <span className="text-[10px] text-zinc-400">
                    Listed on {confirmNonPumpToken.dexId}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmNonPumpToken(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content info */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-2">
              <div className="flex items-center gap-2.5">
                {confirmNonPumpToken.iconUrl && (
                  <img
                    src={confirmNonPumpToken.iconUrl}
                    alt={confirmNonPumpToken.symbol}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                )}
                <div>
                  <span className="text-sm font-black text-amber-400 block leading-tight">
                    ${confirmNonPumpToken.symbol}
                  </span>
                  <span className="text-[11px] text-zinc-400 block">
                    {confirmNonPumpToken.name}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-300 pt-1 leading-relaxed">
                This coin is not on Pump.fun (Trading on{" "}
                <strong className="text-amber-400">{confirmNonPumpToken.dexId}</strong>
                ). Would you still like to proceed to view its chart on DexScreener?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConfirmNonPumpToken(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-bold text-xs transition-colors cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const token = confirmNonPumpToken;
                  setConfirmNonPumpToken(null);
                  if (typeof window !== "undefined") {
                    window.open(token.dexScreenerUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 transition-all uppercase tracking-wider cursor-pointer active:scale-95"
              >
                <span>Continue</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-Over Interactive Token Chart Drawer ─────────────────── */}
      {drawerToken && (
        <TokenChartDrawer
          isOpen={Boolean(drawerToken)}
          onClose={() => setDrawerToken(null)}
          token={drawerToken}
          onQuickBuy={(mint, symbol, amt, name, iconUrl) => {
            setSwapModalToken({
              mint,
              symbol,
              name,
              iconUrl,
              amountSol: amt,
            });
          }}
          onBoostToken={(mint, symbol, name, iconUrl, mcap) => {
            setSelectedBoostToken({
              mint,
              symbol,
              name: name || symbol,
              iconUrl,
              marketCap: mcap,
            });
            setIsBoostModalOpen(true);
          }}
        />
      )}

      {/* ── Instant Jupiter Swap Modal ─────────────────────────────── */}
      {swapModalToken && (
        <JupiterSwapModal
          isOpen={Boolean(swapModalToken)}
          onClose={() => setSwapModalToken(null)}
          targetMint={swapModalToken.mint}
          targetSymbol={swapModalToken.symbol}
          targetName={swapModalToken.name}
          targetIconUrl={swapModalToken.iconUrl}
          initialInputAmount={swapModalToken.amountSol}
        />
      )}

      {/* ── Boost to Leaderboard Modal ─────────────────────────────── */}
      <BoostAnyTokenModal
        isOpen={isBoostModalOpen}
        onClose={() => {
          setIsBoostModalOpen(false);
          setSelectedBoostToken(null);
        }}
        initialToken={selectedBoostToken}
        onSuccess={() => {
          setIsBoostModalOpen(false);
          setSelectedBoostToken(null);
          mutate();
        }}
      />

      {/* ── Auth Required Watchlist Toast Notification ── */}
      {authRequiredToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm p-4 rounded-2xl bg-zinc-950 border border-amber-500/40 text-white shadow-2xl shadow-amber-500/10 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 font-mono">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 fill-current" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide">
              Sign In Required
            </h4>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Please connect your Solana wallet or sign in with Google to save tokens to your personal watchlist.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  dismissAuthToast();
                  window.dispatchEvent(new CustomEvent("outbid:open-auth-modal"));
                }}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[10px] uppercase tracking-wider transition-all"
              >
                Sign In Now
              </button>
              <button
                type="button"
                onClick={dismissAuthToast}
                className="px-2 py-1 text-[10px] text-zinc-400 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default TrendingGrid;
