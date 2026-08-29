"use client";

import { useState, useEffect, useCallback } from "react";
import { TokenStatsResponse } from "@/app/api/token-stats/route";

export function useTokenStats(intervalMs: number = 60_000) {
  const [stats, setStats] = useState<TokenStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/token-stats");
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data: TokenStatsResponse = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: unknown) {
      console.warn("Failed to fetch token stats:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, intervalMs);
    return () => clearInterval(timer);
  }, [fetchStats, intervalMs]);

  return {
    stats,
    totalBurned: stats?.totalBurned ?? 0,
    currentSupply: stats?.currentSupply ?? 1_000_000_000,
    burnPercentage: stats?.burnPercentage ?? 0,
    topHolders: stats?.topHolders ?? [],
    totalHoldersCount: stats?.totalHoldersCount ?? 0,
    isLoading,
    error,
    lastUpdated,
    refresh: fetchStats,
  };
}
