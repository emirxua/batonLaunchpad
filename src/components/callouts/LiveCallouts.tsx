"use client";

/**
 * LiveCallouts — callout card stream.
 *
 * Accepts SWR state from parent (callouts/page.tsx) so a single fetch
 * serves both this component and TrackedLeaderboard.
 *
 * Can also be used standalone (e.g. homepage snippet) with its own SWR.
 */

import React, { useMemo } from "react";
import Image from "next/image";
import useSWR from "swr";
import { CalloutsApiResponse, CalloutCard } from "@/lib/types/callouts";
import { formatCurrency } from "@/lib/utils";
import { useTokenMetadataMap, ResolvedTokenMeta } from "@/hooks/useTokenMetadataMap";
import { useWatchlist } from "@/lib/hooks/useWatchlist";
import {
  ExternalLink,
  Flame,
  Copy,
  Check,
  Clock,
  Eye,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertCircle,
  Radio,
  X,
  Star,
} from "lucide-react";

const BATON_MINT = process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS ?? "";

const fetcher = (url: string): Promise<CalloutsApiResponse> =>
  fetch(url).then((r) => r.json());

function timeAgo(ms: number): string {
  if (!ms) return "—";
  const s = Math.max(0, Date.now() - ms) / 1000;
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface BoostTarget {
  mint: string;
  name?: string;
  symbol?: string;
  logo?: string;
}

interface LiveCalloutsProps {
  // If parent provides SWR state, use it (page layout mode)
  data?: CalloutsApiResponse;
  isLoading?: boolean;
  isValidating?: boolean;
  mutate?: () => void;
  copied?: string | null;
  onCopy?: (text: string) => void;
  // Boost handler with dynamic token data
  onBoostCoin?: (target: BoostTarget | string) => void;
  // Caller filter
  selectedCaller?: string | null;
  onSelectCaller?: (caller: string | null) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const LiveCallouts: React.FC<LiveCalloutsProps> = (props) => {
  // Standalone SWR — only used when parent does NOT pass `data`
  const standalone = useSWR<CalloutsApiResponse>(
    props.data === undefined ? "/api/callouts" : null,
    fetcher,
    {
      refreshInterval: 60_000,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 2,
      errorRetryInterval: 10_000,
      keepPreviousData: true,
    }
  );

  const data = props.data ?? standalone.data;
  const isLoading = props.isLoading ?? standalone.isLoading;
  const isValidating = props.isValidating ?? standalone.isValidating;

  // Local copy state (standalone mode fallback)
  const [_localCopied, _setLocalCopied] = React.useState<string | null>(null);
  const copied = props.copied !== undefined ? props.copied : _localCopied;
  const onCopy =
    props.onCopy ??
    ((text: string) => {
      navigator.clipboard.writeText(text);
      _setLocalCopied(text);
      setTimeout(() => _setLocalCopied(null), 2000);
    });

  const rawCallouts = data?.callouts ?? [];
  const watched = data?.watched ?? [];
  const emptyWallets = data?.emptyWallets ?? [];
  const errors = data?.errors ?? [];

  // Filter by selectedCaller if active
  const filteredCallouts = useMemo(() => {
    if (!props.selectedCaller) return rawCallouts;
    const target = props.selectedCaller.toLowerCase();
    return rawCallouts.filter(
      (c) =>
        c.callerLabel.toLowerCase() === target ||
        c.callerWallet.toLowerCase() === target
    );
  }, [rawCallouts, props.selectedCaller]);

  // Extract unique mint addresses to resolve real dynamic metadata
  const mints = useMemo(() => {
    return filteredCallouts.map((c) => c.coinMint);
  }, [filteredCallouts]);

  const tokenMetaMap = useTokenMetadataMap(mints);

  const handleChipClick = (label: string, wallet: string) => {
    if (!props.onSelectCaller) return;
    const current = props.selectedCaller?.toLowerCase();
    if (current === label.toLowerCase() || current === wallet.toLowerCase()) {
      props.onSelectCaller(null);
    } else {
      props.onSelectCaller(label);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-mono text-zinc-400">
            {rawCallouts.length} callout{rawCallouts.length !== 1 ? "s" : ""} from{" "}
            {watched.filter((w) => w.count > 0).length}/{watched.length || 10} wallets
          </span>
        </div>

        {/* Auto 60s Clock badge */}
        <div className="flex items-center gap-2">
          {data?.updatedAt && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{new Date(data.updatedAt).toLocaleTimeString()}</span>
              <span className="text-zinc-600 border-l border-zinc-800 pl-1.5 ml-0.5">
                auto 60s
              </span>
            </span>
          )}
          {isValidating && (
            <span className="text-[10px] font-mono text-zinc-600 italic">
              syncing…
            </span>
          )}
        </div>
      </div>

      {/* ── Wallet pills (chips) ─────────────────────────────────────── */}
      {watched.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {watched.map(({ wallet, label, count }) => {
            const isSelected =
              Boolean(props.selectedCaller) &&
              (props.selectedCaller?.toLowerCase() === label.toLowerCase() ||
                props.selectedCaller === wallet);

            return (
              <button
                key={wallet}
                type="button"
                onClick={() => handleChipClick(label, wallet)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-amber-500/25 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/40 shadow-sm"
                    : count > 0
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold hover:border-amber-400/50 hover:bg-amber-500/20"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {props.selectedCaller && (
            <button
              type="button"
              onClick={() => props.onSelectCaller?.(null)}
              className="text-[10px] font-mono px-2 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset filter</span>
            </button>
          )}
        </div>
      )}

      {/* ── Active Filter Banner ─────────────────────────────────────── */}
      {props.selectedCaller && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Filtering by: <strong>@{props.selectedCaller}</strong>
              {" "}({filteredCallouts.length} callouts)
            </span>
          </div>
          <button
            type="button"
            onClick={() => props.onSelectCaller?.(null)}
            className="text-[11px] hover:underline text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
          >
            Show all
          </button>
        </div>
      )}

      {/* ── Cards / Empty States ─────────────────────────────────────── */}
      <div className={`transition-opacity duration-200 ${isValidating && rawCallouts.length > 0 ? "opacity-75" : "opacity-100"}`}>
      {isLoading && rawCallouts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse h-52"
            />
          ))}
        </div>
      ) : props.selectedCaller && filteredCallouts.length === 0 ? (
        /* Caller specific empty state (e.g. alonalon) */
        <div className="py-14 flex flex-col items-center gap-3 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <Radio className="w-7 h-7 text-zinc-600" />
          <p className="text-sm font-mono text-zinc-300 font-semibold">
            No callouts for this caller
          </p>
          <p className="text-xs font-mono text-zinc-500 max-w-xs">
            @{props.selectedCaller} has not pushed any callouts to followers recently.
          </p>
          <button
            type="button"
            onClick={() => props.onSelectCaller?.(null)}
            className="mt-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono text-zinc-200 transition-colors cursor-pointer"
          >
            Clear filter
          </button>
        </div>
      ) : filteredCallouts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCallouts.map((card) => (
            <CalloutCardItem
              key={card.calloutId}
              card={card}
              tokenMeta={tokenMetaMap[card.coinMint]}
              copied={copied}
              onCopy={onCopy}
              onBoostCoin={props.onBoostCoin}
            />
          ))}
        </div>
      ) : (
        /* General empty state */
        <div className="py-16 flex flex-col items-center gap-3 text-center rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <Radio className="w-7 h-7 text-zinc-700" />
          <p className="text-sm font-mono text-zinc-400 font-semibold">
            No callouts yet from tracked wallets
          </p>
          <p className="text-xs text-zinc-600 max-w-xs font-mono">
            Callers can only push once every 6 hours. New calls appear
            automatically as they happen.
          </p>
          {emptyWallets.length > 0 && (
            <p className="text-[10px] font-mono text-zinc-700 mt-1">
              Still watching: {emptyWallets.length} wallet
              {emptyWallets.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  card: CalloutCard;
  tokenMeta?: ResolvedTokenMeta;
  copied: string | null;
  onCopy: (t: string) => void;
  onBoostCoin?: (target: BoostTarget | string) => void;
}

const CalloutCardItem: React.FC<CardProps> = ({
  card,
  tokenMeta,
  copied,
  onCopy,
  onBoostCoin,
}) => {
  const isUp = card.multiple >= 1;
  const { toggleWatchCaller, isWatchedCaller, toggleWatchToken, isWatchedToken } = useWatchlist();
  const isCallerFav = isWatchedCaller(card.callerWallet);
  const isTokenFav = isWatchedToken(card.coinMint);

  const handleBoostClick = () => {
    if (!onBoostCoin) return;
    onBoostCoin({
      mint: card.coinMint,
      name: tokenMeta?.name,
      symbol: tokenMeta?.symbol,
      logo: tokenMeta?.imageUrl || card.mediaUrl || undefined,
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex flex-col gap-3 transition-colors">
      {/* Caller row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => toggleWatchCaller(card.callerWallet)}
            className="text-zinc-600 hover:text-amber-400 transition-colors p-0.5"
            title={isCallerFav ? "Unfavorite Caller" : "Favorite Caller"}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isCallerFav
                  ? "fill-amber-400 text-amber-400"
                  : "text-zinc-600 hover:text-amber-400"
              }`}
            />
          </button>
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 uppercase shrink-0">
            {card.callerLabel.slice(0, 2)}
          </div>
          <span className="text-xs font-bold text-white font-mono truncate">
            {card.callerLabel}
          </span>
          <button
            onClick={() => onCopy(card.callerWallet)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
            title="Copy wallet"
          >
            {copied === card.callerWallet ? (
              <Check className="w-3 h-3 text-lime-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
          {timeAgo(card.createdAt)}
        </span>
      </div>

      {/* Media */}
      {card.mediaUrl && (
        <div className="rounded-xl overflow-hidden border border-zinc-800 max-h-48 bg-zinc-950">
          <Image
            src={card.mediaUrl}
            alt="callout media"
            width={480}
            height={270}
            className="w-full object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Thesis */}
      {card.thesis && (
        <p className="text-xs text-zinc-300 italic leading-relaxed line-clamp-3 font-sans">
          &ldquo;{card.thesis}&rdquo;
        </p>
      )}

      {/* Dynamic Target Token row: $SYMBOL (if resolved) + short mint + copy + favorite */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={() => toggleWatchToken(card.coinMint)}
            className="text-zinc-600 hover:text-amber-400 transition-colors p-0.5 shrink-0"
            title={isTokenFav ? "Unfavorite Token" : "Favorite Token"}
          >
            <Star
              className={`w-3 h-3 ${
                isTokenFav
                  ? "fill-amber-400 text-amber-400"
                  : "text-zinc-600 hover:text-amber-400"
              }`}
            />
          </button>

          {tokenMeta?.imageUrl && (
            <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
              <Image
                src={tokenMeta.imageUrl}
                alt={tokenMeta.symbol || "token"}
                width={16}
                height={16}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          )}

          {tokenMeta?.symbol ? (
            <span className="font-bold text-white text-xs truncate">
              ${tokenMeta.symbol.toUpperCase()}
            </span>
          ) : null}

          <span className="text-zinc-500 text-[10px] truncate">
            mint: {card.coinMint.slice(0, 4)}…{card.coinMint.slice(-4)}
          </span>

          <button
            onClick={() => onCopy(card.coinMint)}
            className="text-zinc-600 hover:text-zinc-300 shrink-0 p-0.5"
            title="Copy mint"
          >
            {copied === card.coinMint ? (
              <Check className="w-2.5 h-2.5 text-lime-400" />
            ) : (
              <Copy className="w-2.5 h-2.5" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={`https://dexscreener.com/solana/${card.coinMint}`}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-500 hover:text-zinc-200 font-bold transition-colors"
          >
            DEX
          </a>
          <a
            href={`https://pump.fun/coin/${card.coinMint}`}
            target="_blank"
            rel="noreferrer"
            className="text-lime-500 hover:text-lime-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Stats: mcap-at-call | current multiple | ATH multiple */}
      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
        <div className="px-2 py-1.5 rounded-lg bg-zinc-950/50 border border-zinc-800/50 space-y-0.5">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wide">
            Mcap at call
          </div>
          <div className="font-bold text-zinc-200">
            {card.marketCap > 0 ? formatCurrency(card.marketCap) : "—"}
          </div>
        </div>
        <div className="px-2 py-1.5 rounded-lg bg-zinc-950/50 border border-zinc-800/50 space-y-0.5">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wide">
            Now
          </div>
          <div
            className={`font-bold flex items-center gap-0.5 ${
              isUp ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isUp ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {card.multiple > 0 ? `${card.multiple.toFixed(2)}x` : "—"}
          </div>
        </div>
        <div className="px-2 py-1.5 rounded-lg bg-zinc-950/50 border border-zinc-800/50 space-y-0.5">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wide">
            ATH
          </div>
          <div className="font-bold text-amber-400">
            {card.maxMultiplier > 0 ? `${card.maxMultiplier.toFixed(2)}x` : "—"}
          </div>
        </div>
      </div>

      {/* Engagement */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {card.viewCount.toLocaleString()}
        </span>
        <span>❤️ {card.likes}</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {card.commentCount}
        </span>
        {card.repostCount > 0 && <span>🔁 {card.repostCount}</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/50">
        {BATON_MINT && (
          <button
            onClick={handleBoostClick}
            className="flex-1 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Boost with $BATON
          </button>
        )}
        <a
          href={`https://dexscreener.com/solana/${card.coinMint}`}
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono font-bold transition-colors"
        >
          DEX
        </a>
        <a
          href={`https://pump.fun/coin/${card.coinMint}`}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-lime-500 hover:text-lime-300 transition-colors"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
