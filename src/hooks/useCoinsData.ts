"use client";

import useSWR from "swr";
import { Coin } from "@/types/coin";
import { getBurnLevel } from "@/lib/burn-levels";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCoinsData(_interval?: number) {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/coins",
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
      dedupingInterval: 15_000,
    }
  );

  const rawCoins: Coin[] = (data?.data || []).map((t: any) => {
    const burned = t.totalBurnedBaton ?? 0;
    return {
      id: t.id || `coin-${t.mintAddress}`,
      name: t.name || "Baton",
      ticker: t.ticker || "BATON",
      mintAddress: t.mintAddress || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
      imageUrl: t.imageUrl,
      headerUrl: t.headerUrl,
      iconColor: t.iconColor || "#ff3d7a",
      category: t.category || "Mascots",
      description: t.description || "",
      website: t.website,
      twitter: t.twitter,
      viewsCount: t.viewsCount || 0,
      marketCap: t.marketCap || 0,
      volume24h: t.volume24h || 0,
      change24h: t.change24h || 0,
      priceUsd: t.priceUsd || 0,
      sparkline: t.sparkline || [],
      totalBurnedBaton: burned,
      burnLevel: t.burnLevel || getBurnLevel(burned),
      pairAddress: t.pairAddress,
      liquidityUsd: t.liquidityUsd || 0,
    };
  });

  return {
    coins: rawCoins,
    featuredCoin: rawCoins[0] || null,
    totalCoinsCount: rawCoins.length,
    lastUpdated: new Date(),
    isLoading,
    error,
    refresh: mutate,
    mutate,
  };
}
