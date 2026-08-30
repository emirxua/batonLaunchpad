"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface BurnRecord {
  id: string;
  txHash: string;
  txSignature?: string;
  coinId: string;
  coinName?: string;
  coinTicker?: string;
  coinMint?: string;
  amount: number;
  userAddress: string;
  timestamp: number;
  isRealBurn?: boolean;
}

export function useRecentBurns(_interval?: number) {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/burns",
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
      dedupingInterval: 15_000,
    }
  );

  const rawBurns: BurnRecord[] = (data?.recentBurns || []).map((b: any) => ({
    id: b.id || `burn-${b.txHash}`,
    txHash: b.txHash,
    txSignature: b.txHash,
    coinId: b.coinId,
    coinName: b.coinName || "Token",
    coinTicker: b.coinTicker || "TOKEN",
    coinMint: b.coinMint || b.coinId,
    amount: b.amount || 0,
    userAddress: b.userAddress || "anon",
    timestamp: b.timestamp || Date.now(),
    isRealBurn: true,
  }));

  const totalRecordedBurns = data?.totalBurnedAmount || 0;

  return {
    recentBurns: rawBurns,
    totalRecordedBurns,
    isLoading,
    error,
    refresh: mutate,
    mutate,
  };
}
