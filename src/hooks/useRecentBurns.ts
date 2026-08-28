"use client";

import { useState, useEffect, useCallback } from "react";
import { RecordedBurn } from "@/app/api/burns/route";

export function useRecentBurns(intervalMs: number = 10_000) {
  const [recentBurns, setRecentBurns] = useState<RecordedBurn[]>([]);
  const [totalRecordedBurns, setTotalRecordedBurns] = useState<number>(0);
  const [totalBurnedAmount, setTotalBurnedAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBurns = useCallback(async () => {
    try {
      const res = await fetch("/api/burns");
      if (!res.ok) throw new Error("Failed to fetch recent burns");
      const data = await res.json();
      if (data.success) {
        setRecentBurns(data.recentBurns || []);
        setTotalRecordedBurns(data.totalRecordedBurns || 0);
        setTotalBurnedAmount(data.totalBurnedAmount || 0);
      }
    } catch (err) {
      console.warn("Could not fetch recent burns:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBurns();
    if (intervalMs <= 0) return;
    const interval = setInterval(fetchBurns, intervalMs);
    return () => clearInterval(interval);
  }, [fetchBurns, intervalMs]);

  return {
    recentBurns,
    totalRecordedBurns,
    totalBurnedAmount,
    isLoading,
    refresh: fetchBurns,
  };
}
