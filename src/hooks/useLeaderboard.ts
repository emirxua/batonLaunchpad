"use client";

import useSWR from "swr";
import { Coin } from "@/types/coin";
import { LeaderboardItem } from "@/types/token";
import { getBurnLevel } from "@/lib/burn-levels";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLeaderboard(_interval?: number) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    "/api/leaderboard",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  );

  const rankedCoins: Coin[] = (data?.coins || data?.rankedCoins || data?.data || []).map(
    (item: any, idx: number) => {
      const burned = item.totalBurnedBaton ?? 0;
      return {
        id: item.id || `coin-${item.mintAddress || item.ca || idx}`,
        name: item.name || "Solana Project",
        ticker: item.ticker || item.symbol || "SOL",
        mintAddress: item.mintAddress || item.ca || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
        imageUrl: item.imageUrl || item.iconUrl || undefined,
        iconColor: item.iconColor || "#f59e0b",
        marketCap: item.marketCap || item.mcap || 0,
        volume24h: item.volume24h || 0,
        change24h: item.change24h || item.priceChange24h || 0,
        priceUsd: item.priceUsd || 0,
        sparkline: item.sparkline || [],
        totalBurnedBaton: burned,
        burnLevel: item.burnLevel || getBurnLevel(burned),
        pairAddress: item.pairAddress,
        liquidityUsd: item.liquidityUsd || 0,
      };
    }
  );

  const leaderboard: LeaderboardItem[] = rankedCoins.map((c, idx) => ({
    rank: idx + 1,
    projectName: c.name,
    symbol: c.ticker,
    ca: c.mintAddress,
    totalBatonBurned: c.totalBurnedBaton,
    boostedBy: idx === 0 ? "Top Whale Community" : "Solana Community",
    timeRemaining: "Live",
    mcap: c.marketCap,
    mcapFormatted:
      c.marketCap >= 1e9
        ? `$${(c.marketCap / 1e9).toFixed(2)}B`
        : c.marketCap >= 1e6
        ? `$${(c.marketCap / 1e6).toFixed(1)}M`
        : `$${c.marketCap.toLocaleString()}`,
    volume24h: c.volume24h,
    iconUrl: c.imageUrl,
  }));

  return {
    leaderboard,
    rankedCoins,
    totalBurned: data?.totalBurned ?? (rankedCoins.length > 0 ? rankedCoins[0].totalBurnedBaton : 0),
    activeRooms: data?.activeRooms ?? rankedCoins.length,
    updatedAt: new Date().toISOString(),
    isLoading,
    isValidating,
    error,
    refresh: mutate,
    mutate,
  };
}
