"use client";

import React from "react";
import useSWR from "swr";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TickerToken {
  mint: string;
  symbol: string;
  name: string;
  priceFormatted: string;
  changeFormatted: string;
  isPositive: boolean;
  iconUrl: string;
  pumpUrl: string;
}

export const Ticker: React.FC = React.memo(() => {
  const { data: trendingData } = useSWR("/api/trending", fetcher, {
    refreshInterval: 4_000,
    revalidateOnFocus: true,
    dedupingInterval: 2_500,
  });

  const { data: statsData } = useSWR("/api/stats/active-users", fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  const activeOnlineUsers = statsData?.activeUsers ?? 1;

  const tokens: TickerToken[] = React.useMemo(() => {
    const raw: any[] = trendingData?.tokens || trendingData?.data || [];
    if (!raw || raw.length === 0) return [];

    return raw.map((t: any) => {
      const mint = t.mint || t.address || t.pairAddress || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
      const symbol = (t.symbol || "TOKEN").toUpperCase();
      const price = t.priceUsd ?? t.price ?? 0;
      const change = t.priceChange24h ?? 0;
      const isPos = change >= 0;

      // Pump.fun direct url
      const pumpUrl = mint === "So11111111111111111111111111111111111111112"
        ? "https://dexscreener.com/solana/sol"
        : `https://pump.fun/coin/${mint}`;

      const iconUrl =
        t.iconUrl ||
        t.imageUrl ||
        (mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump"
          ? "/images/baton-logo.png"
          : "");

      return {
        mint,
        symbol,
        name: t.name || symbol,
        priceFormatted:
          price < 0.00001
            ? `$${price.toFixed(7)}`
            : price < 0.01
            ? `$${price.toFixed(5)}`
            : price < 1
            ? `$${price.toFixed(4)}`
            : `$${price.toFixed(2)}`,
        changeFormatted: `${isPos ? "+" : ""}${change.toFixed(1)}%`,
        isPositive: isPos,
        iconUrl,
        pumpUrl,
      };
    });
  }, [trendingData]);

  if (tokens.length === 0) return null;

  return (
    <div className="w-full bg-[#08090C] text-zinc-300 border-b border-white/[0.06] h-8 sm:h-8.5 flex items-center overflow-hidden select-none z-30 relative font-mono text-[11px]">
      {/* ── Top-Leftmost Clean Online Indicator (Frameless & Sleek) ──────── */}
      <div
        className="flex items-center gap-1.5 px-3 h-full shrink-0 bg-[#08090C] z-20 border-r border-white/[0.08] text-[11px] font-mono select-none"
        title="Live traders online"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
        <span className="text-white font-extrabold">{activeOnlineUsers}</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">ONLINE</span>
      </div>

      {/* ── Seamless Full-Width Continuous Marquee ──────────────────────── */}
      <div className="flex overflow-hidden w-full group">
        <div className="animate-marquee-gpu items-center flex hover:[animation-play-state:paused] py-1">
          {/* Loop 1 */}
          {tokens.map((t, idx) => (
            <a
              key={`t1-${t.mint}-${idx}`}
              href={t.pumpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1 mx-0.5 rounded-lg hover:bg-white/[0.06] hover:border-amber-500/30 transition-all group/item shrink-0 cursor-pointer"
              title={`View ${t.symbol} on Pump.fun`}
            >
              {/* Token Image from Pump.fun / DexScreener */}
              <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 bg-zinc-800 ring-1 ring-white/10 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.iconUrl}
                  alt={t.symbol}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              {/* Symbol */}
              <span className="font-extrabold text-white text-[11px] group-hover/item:text-amber-400 transition-colors">
                ${t.symbol}
              </span>

              {/* Price */}
              <span className="font-bold text-zinc-200 text-[11px] tracking-tight">
                {t.priceFormatted}
              </span>

              {/* 24h Change Badge */}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold flex items-center gap-0.5 ${
                  t.isPositive
                    ? "text-emerald-400 bg-emerald-500/15 border border-emerald-500/25"
                    : "text-rose-400 bg-rose-500/15 border border-rose-500/25"
                }`}
              >
                {t.isPositive ? (
                  <TrendingUp className="w-2.5 h-2.5 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 stroke-[2.5]" />
                )}
                <span>{t.changeFormatted}</span>
              </span>

              {/* Mini Pump Pill */}
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-extrabold flex items-center gap-0.5 opacity-80 group-hover/item:opacity-100">
                <span>💊</span>
              </span>

              <span className="text-zinc-700 ml-1.5">•</span>
            </a>
          ))}

          {/* Loop 2 (Seamless Infinite Scrolling) */}
          {tokens.map((t, idx) => (
            <a
              key={`t2-${t.mint}-${idx}`}
              href={t.pumpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1 mx-0.5 rounded-lg hover:bg-white/[0.06] hover:border-amber-500/30 transition-all group/item shrink-0 cursor-pointer"
              title={`View ${t.symbol} on Pump.fun`}
            >
              {/* Token Image from Pump.fun / DexScreener */}
              <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 bg-zinc-800 ring-1 ring-white/10 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.iconUrl}
                  alt={t.symbol}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              {/* Symbol */}
              <span className="font-extrabold text-white text-[11px] group-hover/item:text-amber-400 transition-colors">
                ${t.symbol}
              </span>

              {/* Price */}
              <span className="font-bold text-zinc-200 text-[11px] tracking-tight">
                {t.priceFormatted}
              </span>

              {/* 24h Change Badge */}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold flex items-center gap-0.5 ${
                  t.isPositive
                    ? "text-emerald-400 bg-emerald-500/15 border border-emerald-500/25"
                    : "text-rose-400 bg-rose-500/15 border border-rose-500/25"
                }`}
              >
                {t.isPositive ? (
                  <TrendingUp className="w-2.5 h-2.5 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 stroke-[2.5]" />
                )}
                <span>{t.changeFormatted}</span>
              </span>

              {/* Mini Pump Pill */}
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-extrabold flex items-center gap-0.5 opacity-80 group-hover/item:opacity-100">
                <span>💊</span>
              </span>

              <span className="text-zinc-700 ml-1.5">•</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
});

Ticker.displayName = "Ticker";

export default Ticker;
