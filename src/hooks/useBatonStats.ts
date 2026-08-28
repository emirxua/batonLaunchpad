"use client";

import { useState } from "react";

export interface BatonStats {
  totalBurned: number;
  activeCampaigns: number;
  totalMarketCap: number;
  solanaTps: number;
}

export function useBatonStats() {
  const [stats] = useState<BatonStats>({
    totalBurned: 48_290_420,
    activeCampaigns: 142,
    totalMarketCap: 18_450_000,
    solanaTps: 2840,
  });

  return { stats };
}
