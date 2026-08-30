"use client";

import useSWR from "swr";
import { TopHolder, TokenStatsResponse } from "@/app/api/token-stats/route";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTokenStats(interval: number = 10_000) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TokenStatsResponse>(
    "/api/token-stats",
    fetcher,
    {
      refreshInterval: interval,
      revalidateOnFocus: true,
      dedupingInterval: 3_000,
    }
  );

  const totalBurned = data?.totalBurned ?? 0;
  const burnPercentage = data?.burnPercentage ?? 0;
  const topHolders: TopHolder[] = data?.topHolders ?? [];
  const totalHoldersCount = data?.totalHoldersCount ?? topHolders.length;

  return {
    stats: {
      totalBurned,
      totalCoinsCount: 1,
      activeRooms: 1,
      totalVolume24h: 0,
    },
    totalBurned,
    burnPercentage,
    totalCoinsCount: 1,
    activeRooms: 1,
    totalVolume24h: 0,
    topHolders,
    totalHoldersCount,
    lastUpdated: data?.lastUpdated ? new Date(data.lastUpdated) : new Date(),
    isLoading,
    isValidating,
    mutate,
    refresh: mutate,
  };
}
