import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { TrendingTokenItem } from "@/types/token";
import { JupiterSwapModal } from "@/components/modals/JupiterSwapModal";
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
} from "lucide-react";

type FilterTab = "all" | "gainers" | "top_volume" | "high_mcap";

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmNonPumpToken, setConfirmNonPumpToken] = useState<any | null>(null);
  const [swapModalToken, setSwapModalToken] = useState<{
    mint: string;
    symbol: string;
    name?: string;
    iconUrl?: string;
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
    const isPumpCoin =
      token.ca.toLowerCase().endsWith("pump") &&
      !token.dexId.toLowerCase().includes("meteora");

    if (isPumpCoin) {
      onSelectToken?.(token.ca, token.symbol, token.name, token.iconUrl);
      if (typeof window !== "undefined") {
        window.open(`https://pump.fun/coin/${token.ca}`, "_blank", "noopener,noreferrer");
      }
    } else {
      // Prompt user confirmation modal before opening non-pump token
      setConfirmNonPumpToken(token);
    }
  };

  const rawTokens: any[] = data?.tokens || data?.data || [];

  const allTokens: any[] = rawTokens.map((t: any) => {
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
    return allTokens;
  }, [activeTab, allTokens]);

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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-1 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "high_mcap"
                  ? "bg-amber-500 text-zinc-950 font-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              💎 $1M+ MCAP
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            title="Refresh Trending Data"
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-amber-400 transition-all cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

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
              title={
                isPump
                  ? `Click to open ${token.symbol} on Pump.fun`
                  : `Click to view ${token.symbol} chart on DexScreener (${token.dexId})`
              }
              className="group bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer"
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

              {/* ── Actions Row: Instant Swap, DEX, Pump, Copy CA ─────────── */}
              <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-1.5">
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
                    onSelectToken?.(token.ca, token.symbol, token.name, token.iconUrl);
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  <Zap className="w-3 h-3" />
                  <span>Instant Swap</span>
                </button>

                <a
                  href={token.dexScreenerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 text-zinc-400 hover:text-amber-400 transition-colors text-[10px] font-bold flex items-center gap-1"
                  title="View on DexScreener"
                >
                  <span>🦅 Dex</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>

                <button
                  type="button"
                  onClick={(e) => handleCopy(token.ca, e)}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Copy CA"
                >
                  {copiedCA === token.ca ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
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

      {/* ── Instant Jupiter Swap Modal ─────────────────────────────── */}
      {swapModalToken && (
        <JupiterSwapModal
          isOpen={Boolean(swapModalToken)}
          onClose={() => setSwapModalToken(null)}
          targetMint={swapModalToken.mint}
          targetSymbol={swapModalToken.symbol}
          targetName={swapModalToken.name}
          targetIconUrl={swapModalToken.iconUrl}
        />
      )}
    </section>
  );
}

export default TrendingGrid;
