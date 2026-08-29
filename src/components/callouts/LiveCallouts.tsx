"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  CalloutsApiResponse,
  CalloutCard,
} from "@/lib/types/callouts";
import { formatCurrency } from "@/lib/utils";
import {
  Radio,
  RefreshCw,
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
  Users,
} from "lucide-react";

const BATON_MINT =
  process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS ||
  "6Hebn672FvMSq61mo4HYq86QgLHgBUm6y8A9bXGppump";

const fetcher = async (url: string): Promise<CalloutsApiResponse> => {
  const res = await fetch(url);
  const data = await res.json();
  return data;
};

function formatTimeAgo(ts: number): string {
  if (!ts) return "—";
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function fmtMultiplier(x: number) {
  if (!x || x <= 0) return "—";
  return `${x.toFixed(2)}x`;
}

interface LiveCalloutsProps {
  onBoostCoin?: (mint: string, name: string, symbol: string) => void;
}

export const LiveCallouts: React.FC<LiveCalloutsProps> = ({ onBoostCoin }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<CalloutsApiResponse>("/api/callouts", fetcher, {
      refreshInterval: 15_000,
      keepPreviousData: true,
    });

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const callouts = data?.callouts ?? [];
  const watched = data?.watched ?? [];
  const emptyWallets = data?.emptyWallets ?? [];
  const errs = data?.errors ?? [];

  return (
    <div className="space-y-6 w-full">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white font-mono">
              Pump.fun Native Callouts
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              Live push calls from watched wallets · 15s refresh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data?.updatedAt && (
            <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1 bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700/50">
              <Clock className="w-3 h-3" />
              {new Date(data.updatedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isValidating ? "animate-spin text-lime-400" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Watched wallets summary pills ──────────────────────────────── */}
      {watched.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {watched.map(({ wallet, label, count }) => (
            <span
              key={wallet}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-full border font-semibold ${
                count > 0
                  ? "bg-lime-500/10 border-lime-500/30 text-lime-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-500"
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-70">{count > 0 ? `${count} calls` : "empty"}</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Upstream errors (non-fatal, show inline) ──────────────────── */}
      {errs.length > 0 && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 space-y-1">
          <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            Upstream fetch errors ({errs.length})
          </div>
          <ul className="text-[10px] font-mono text-zinc-400 space-y-0.5">
            {errs.map((e, i) => (
              <li key={i}>
                <span className="text-zinc-500">{e.wallet.slice(0, 8)}…</span>{" "}
                {e.status ? `HTTP ${e.status}: ` : ""}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Main callout grid ──────────────────────────────────────────── */}
      {isLoading && callouts.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse space-y-3 h-48"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-28 h-3 bg-zinc-800 rounded" />
                  <div className="w-16 h-2 bg-zinc-800/60 rounded" />
                </div>
              </div>
              <div className="w-full h-10 bg-zinc-800/40 rounded-xl" />
              <div className="flex justify-between">
                <div className="w-20 h-4 bg-zinc-800 rounded" />
                <div className="w-16 h-4 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : callouts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {callouts.map((card) => (
            <CalloutCardItem
              key={card.calloutId}
              card={card}
              copiedId={copiedId}
              onCopy={copy}
              onBoostCoin={onBoostCoin}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 rounded-2xl bg-zinc-900/30 border border-zinc-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-zinc-300 font-medium text-sm font-mono">
            No active callouts from watched wallets
          </p>
          <p className="text-zinc-500 text-xs max-w-xs mx-auto">
            Callers operate on a 6-hour cooldown. New calls will appear here
            automatically.
          </p>
          {emptyWallets.length > 0 && (
            <p className="text-[10px] font-mono text-zinc-600">
              Empty: {emptyWallets.length} wallet(s) returned 0 callouts.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Individual card ───────────────────────────────────────────────────────────

interface CardProps {
  card: CalloutCard;
  copiedId: string | null;
  onCopy: (text: string) => void;
  onBoostCoin?: (mint: string, name: string, symbol: string) => void;
}

const CalloutCardItem: React.FC<CardProps> = ({
  card,
  copiedId,
  onCopy,
  onBoostCoin,
}) => {
  const isWatcher =
    card.callerLabel && card.callerLabel !== card.callerWallet.slice(0, 8) + "…";
  const multiplierGood = card.multiple >= 1;
  const maxMultiplierGood = card.maxMultiplier >= 1;

  return (
    <div
      className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all hover:shadow-md ${
        isWatcher
          ? "bg-zinc-900/90 border-amber-500/30 hover:border-amber-500/50"
          : "bg-zinc-900/70 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* ── Caller row ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-lime-500/30 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 uppercase">
            {card.callerLabel.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white font-mono truncate">
                {card.callerLabel}
              </span>
              {isWatcher && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase shrink-0">
                  WATCHING
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
              <span>{card.callerWallet.slice(0, 4)}…{card.callerWallet.slice(-4)}</span>
              <button
                onClick={() => onCopy(card.callerWallet)}
                className="hover:text-zinc-300 transition-colors"
                title="Copy wallet"
              >
                {copiedId === card.callerWallet ? (
                  <Check className="w-2.5 h-2.5 text-lime-400" />
                ) : (
                  <Copy className="w-2.5 h-2.5" />
                )}
              </button>
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 shrink-0">
          {formatTimeAgo(card.createdAt)}
        </span>
      </div>

      {/* ── Token mint row ── */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-950/60 border border-zinc-800/70">
        <div className="flex items-center gap-1.5 min-w-0 text-[11px] font-mono text-zinc-300">
          <span className="text-zinc-500">mint:</span>
          <span className="truncate">{card.coinMint.slice(0, 8)}…{card.coinMint.slice(-6)}</span>
          <button
            onClick={() => onCopy(card.coinMint)}
            className="text-zinc-500 hover:text-zinc-300 shrink-0"
            title="Copy mint"
          >
            {copiedId === card.coinMint ? (
              <Check className="w-2.5 h-2.5 text-lime-400" />
            ) : (
              <Copy className="w-2.5 h-2.5" />
            )}
          </button>
        </div>
        <a
          href={`https://pump.fun/coin/${card.coinMint}`}
          target="_blank"
          rel="noreferrer"
          className="text-lime-400 hover:text-lime-300 shrink-0"
          title="Open on Pump.fun"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* ── Thesis ── */}
      {card.thesis && (
        <div className="flex items-start gap-1.5 px-3 py-2 rounded-xl bg-zinc-950/40 border border-zinc-800/50">
          <MessageSquare className="w-3 h-3 text-zinc-500 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed italic">
            {card.thesis}
          </p>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
        <div className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
          <div className="text-[9px] text-zinc-500 uppercase">Market Cap</div>
          <div className="font-bold text-zinc-200 mt-0.5">
            {card.marketCap > 0 ? formatCurrency(card.marketCap) : "—"}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
          <div className="text-[9px] text-zinc-500 uppercase">Multiple</div>
          <div
            className={`font-bold mt-0.5 flex items-center gap-0.5 ${
              multiplierGood ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {multiplierGood ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {fmtMultiplier(card.multiple)}
          </div>
        </div>
        <div className="p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
          <div className="text-[9px] text-zinc-500 uppercase">Max</div>
          <div
            className={`font-bold mt-0.5 ${
              maxMultiplierGood ? "text-amber-400" : "text-zinc-400"
            }`}
          >
            {fmtMultiplier(card.maxMultiplier)}
          </div>
        </div>
      </div>

      {/* ── Engagement row ── */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {card.viewCount.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          ❤️ {card.likes}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          {card.commentCount}
        </span>
        {card.repostCount > 0 && (
          <span className="flex items-center gap-1">
            🔁 {card.repostCount}
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
        <button
          onClick={() =>
            onBoostCoin
              ? onBoostCoin(card.coinMint, card.coinMint.slice(0, 6), "?")
              : window.open(`https://pump.fun/coin/${BATON_MINT}`, "_blank")
          }
          className="flex-1 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          Boost with $BATON
        </button>

        <a
          href={`https://dexscreener.com/solana/${card.coinMint}`}
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-bold transition-colors"
          title="DexScreener"
        >
          DEX
        </a>

        <a
          href={`https://pump.fun/coin/${card.coinMint}`}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-lime-400 transition-colors"
          title="Pump.fun"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
