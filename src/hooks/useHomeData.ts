"use client";

import useSWR from "swr";
import { Coin } from "@/types/coin";
import { getFallbackCoins } from "@/lib/tracked-coins";

export interface DirectoryApiResponse {
  success: boolean;
  timestamp: number;
  totalBurned: number;
  coins: Coin[];
  top1Coin: Coin | null;
  marketOverview: {
    activeRooms: number;
    totalVolume24h: number;
    attentionLeaderTicker: string;
    attentionLeaderMcap: number;
  };
}

const fetcher = async (url: string): Promise<DirectoryApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Directory fetch failed: ${res.status}`);
  }
  return res.json();
};

export function useHomeData() {
  const fallbackList = getFallbackCoins();
  const fallbackTop1 = fallbackList[0] || null;

  const { data, error, isLoading, mutate } = useSWR<DirectoryApiResponse>(
    "/api/directory",
    fetcher,
    {
      refreshInterval: 15_000,
      dedupingInterval: 8_000,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      keepPreviousData: true,
    }
  );

  const coins = data?.coins && data.coins.length > 0 ? data.coins : fallbackList;
  const top1Coin = data?.top1Coin || (coins.length > 0 ? coins[0] : fallbackTop1);
  const rankedCoins = coins.slice(1); // #2 to #10+
  const totalBurned =
    data?.totalBurned ??
    coins.reduce((acc, c) => acc + (c.totalBurnedBaton || 0), 0);

  const activeRooms =
    data?.marketOverview?.activeRooms ??
    coins.filter((c) => (c.volume24h || 0) > 0).length;

  const totalVolume24h =
    data?.marketOverview?.totalVolume24h ??
    coins.reduce((acc, c) => acc + (c.volume24h || 0), 0);

  return {
    coins,
    top1Coin,
    rankedCoins,
    totalBurned,
    activeRooms,
    totalVolume24h,
    isLoading: isLoading && !data,
    isError: !!error,
    refresh: () => mutate(),
  };
}

export default useHomeData;
