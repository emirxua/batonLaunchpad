"use client";

import useSWR from "swr";
import { Coin } from "@/types/coin";
import { CalloutItem } from "@/types/token";
import { getBurnLevel } from "@/lib/burn-levels";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useHomeData() {
  const { data: directoryData, mutate: refreshDirectory } = useSWR(
    "/api/directory",
    fetcher,
    {
      refreshInterval: 15_000,
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
    }
  );

  const { data: calloutData, mutate: refreshCallouts } = useSWR(
    "/api/callouts",
    fetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
      dedupingInterval: 15_000,
    }
  );

  const rawCoins = directoryData?.coins || [];
  const coins: Coin[] = rawCoins.map((c: any) => ({
    id: c.id || `coin-${c.mintAddress}`,
    name: c.name || "Solana Token",
    ticker: c.ticker || "TOKEN",
    mintAddress: c.mintAddress || "",
    imageUrl: c.imageUrl,
    iconColor: c.iconColor || "#f59e0b",
    marketCap: c.marketCap || 0,
    volume24h: c.volume24h || 0,
    change24h: c.change24h || 0,
    priceUsd: c.priceUsd || 0,
    sparkline: c.sparkline || [],
    totalBurnedBaton: c.totalBurnedBaton || 0,
    burnLevel: c.burnLevel || getBurnLevel(c.totalBurnedBaton || 0),
    pairAddress: c.pairAddress,
    liquidityUsd: c.liquidityUsd || 0,
  }));

  const top1Coin = directoryData?.top1Coin || coins[0] || null;
  const rankedCoins = coins.slice(1);

  const recentCallouts: CalloutItem[] = (calloutData?.callouts || []).map((c: any) => ({
    id: c.calloutId || `callout-${c.coinMint}`,
    callerName: c.callerLabel || (c.userId ? `${c.userId.slice(0, 4)}…${c.userId.slice(-4)}` : "Verified Caller"),
    callerHandle: c.callerWallet ? `${c.callerWallet.slice(0, 4)}…${c.callerWallet.slice(-4)}` : "sol_trader",
    callerAvatar: (c.coinSymbol || "CA").slice(0, 2).toUpperCase(),
    callerBadge: c.isWatched ? "Top Whitelist" : "Alpha Node",
    tokenName: c.coinName || "Solana Token",
    tokenSymbol: c.coinSymbol || (c.coinMint ? c.coinMint.slice(0, 4).toUpperCase() : "TOKEN"),
    tokenCA: c.coinMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
    calloutPrice: c.calloutPriceUsd || c.calloutPrice || 0,
    currentPrice: (c.calloutPriceUsd || 0) * (c.multiple || 1),
    entryMcap: c.marketCap || 0,
    currentMcap: Math.round((c.marketCap || 0) * (c.multiple || 1)),
    multiplier: Number((c.multiple || 1).toFixed(2)),
    timeAgo: c.createdAt ? `${Math.max(1, Math.floor((Date.now() - c.createdAt) / 60000))}m ago` : "Live",
    upvotes: c.upvotes || 0,
    batonBurned: c.batonBurned || 0,
    thesis: c.thesis || "",
  }));

  return {
    coins,
    top1Coin,
    rankedCoins,
    totalBurned: directoryData?.totalBurned ?? 0,
    activeRooms: directoryData?.marketOverview?.activeRooms ?? 0,
    totalVolume24h: directoryData?.marketOverview?.totalVolume24h ?? 0,
    recentCallouts,
    isLoading: !directoryData,
    refresh: () => {
      refreshDirectory();
      refreshCallouts();
    },
  };
}
