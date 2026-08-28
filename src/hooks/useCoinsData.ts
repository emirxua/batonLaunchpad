"use client";

import { useState, useEffect, useCallback } from "react";
import { Coin } from "@/types/coin";
import { getFallbackCoins } from "@/lib/tracked-coins";

export interface CoinsDataState {
  coins: Coin[];
  featuredCoin: Coin | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function useCoinsData(pollingIntervalMs: number = 15_000): CoinsDataState {
  const [coins, setCoins] = useState<Coin[]>(() => getFallbackCoins());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCoins = useCallback(async (showLoading: boolean = false) => {
    if (showLoading) setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const response = await fetch("/api/coins", {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP status ${response.status}`);
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setCoins(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || "Invalid response format from /api/coins");
      }
    } catch (err: unknown) {
      console.warn("useCoinsData: Failed to refresh coins data, keeping cache.", err);
      setIsError(true);
      setError(err instanceof Error ? err.message : "Error fetching coins data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCoins(true);
  }, [fetchCoins]);

  // Polling every 30s
  useEffect(() => {
    if (pollingIntervalMs <= 0) return;

    const interval = setInterval(() => {
      fetchCoins(false);
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [fetchCoins, pollingIntervalMs]);

  // Identify featured coin ($BATON or top burned)
  const featuredCoin =
    coins.find((c) => c.ticker === "BATON" || c.id === "baton-primary") ||
    coins[0] ||
    null;

  return {
    coins,
    featuredCoin,
    isLoading,
    isError,
    error,
    lastUpdated,
    refresh: () => fetchCoins(true),
  };
}
