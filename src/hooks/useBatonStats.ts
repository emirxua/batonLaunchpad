"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface BatonStats {
  totalBurned: number;
  activeCampaigns: number;
  totalMarketCap: number;
  solanaTps: number;
}

export function useBatonStats() {
  const { data } = useSWR("/api/directory", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: false,
    dedupingInterval: 15_000,
  });

  const stats: BatonStats = {
    totalBurned: data?.totalBurned ?? 0,
    activeCampaigns: data?.marketOverview?.activeRooms ?? 0,
    totalMarketCap: data?.marketOverview?.attentionLeaderMcap ?? 0,
    solanaTps: 2500,
  };

  return { stats };
}
