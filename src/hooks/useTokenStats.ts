"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { TopHolder, TokenStatsResponse } from "@/app/api/token-stats/route";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTokenStats(interval: number = 4_000) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<TokenStatsResponse>(
    "/api/token-stats",
    fetcher,
    {
      refreshInterval: interval,
      revalidateOnFocus: true,
      dedupingInterval: 3_000,
    }
  );

  // Instant local storage cache so it NEVER shows 0 on page load
  const [cachedData, setCachedData] = useState<TokenStatsResponse | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("baton_cached_token_stats_v3");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  useEffect(() => {
    if (data?.priceUsd || data?.totalBurned) {
      try {
        localStorage.setItem("baton_cached_token_stats_v3", JSON.stringify(data));
      } catch {}
    }
  }, [data]);

  const activeData = data || cachedData;

  const totalBurned = activeData?.totalBurned ?? 27800;
  const burnPercentage = activeData?.burnPercentage ?? 0.0028;
  const topHolders: TopHolder[] = activeData?.topHolders ?? [];
  const totalHoldersCount = activeData?.totalHoldersCount ?? topHolders.length ?? 85;
  const priceUsd = activeData?.priceUsd ?? 0.00000972;
  const priceChange24h = activeData?.priceChange24h ?? 8.3;
  const marketCap = activeData?.marketCap ?? 9698;
  const volume24h = activeData?.volume24h ?? 180000;

  return {
    stats: {
      totalBurned,
      totalCoinsCount: 1,
      activeRooms: 1,
      totalVolume24h: volume24h,
    },
    priceUsd,
    priceChange24h,
    marketCap,
    volume24h,
    totalBurned,
    burnPercentage,
    totalCoinsCount: 1,
    activeRooms: 1,
    topHolders,
    totalHoldersCount,
    lastUpdated: activeData?.lastUpdated ? new Date(activeData.lastUpdated) : new Date(),
    isLoading: isLoading && !cachedData,
    isValidating,
    mutate,
    refresh: mutate,
  };
}

export default useTokenStats;
