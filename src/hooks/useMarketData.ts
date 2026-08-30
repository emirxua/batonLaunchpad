"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Market data API error");
    return res.json();
  });

export interface GlobalMarketAsset {
  symbol: string;
  name: string;
  price: number;
  priceFormatted: string;
  change24h: number;
  changeFormatted: string;
  isPositive: boolean;
  volume24h: number;
  volumeFormatted: string;
  sparkline: number[];
}

export function useMarketStats() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/market-stats",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    }
  );

  const rawList = data?.data || [];
  const markets: GlobalMarketAsset[] = rawList.map((item: any) => {
    const change = item.priceChangePercent24h ?? 0;
    const isPos = change >= 0;
    const price = item.price ?? 0;
    return {
      symbol: item.symbol,
      name: item.name,
      price,
      priceFormatted:
        price < 1
          ? `$${price.toFixed(4)}`
          : `$${price.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
      change24h: change,
      changeFormatted: `${isPos ? "+" : ""}${change.toFixed(2)}%`,
      isPositive: isPos,
      volume24h: item.volume24h ?? 0,
      volumeFormatted:
        item.volume24h >= 1e9
          ? `$${(item.volume24h / 1e9).toFixed(2)}B`
          : `$${(item.volume24h / 1e6).toFixed(1)}M`,
      sparkline: item.sparkline ?? [],
    };
  });

  return {
    markets,
    isLoading,
    error,
    refresh: mutate,
  };
}
