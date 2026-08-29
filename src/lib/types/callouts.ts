export interface CalloutCard {
  id: string;
  mint: string;
  caller: string;
  callerUsername?: string;
  callerAvatarUrl?: string;
  isWatchlist?: boolean;
  watchlistLabel?: string;
  thesis?: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImageUrl?: string;
  calledAt: number;
  mcapAtCall?: number;
  currentMcap: number;
  currentPriceUsd: string;
  priceChange24h: number;
  volume24h: number;
  multiplier: number;
  pumpFunUrl: string;
  dexScreenerUrl: string;
  isBoosted?: boolean;
  source: string;
  rawPumpData?: Record<string, unknown>;
}

export interface TopCaller {
  rank: number;
  wallet: string;
  username?: string;
  avatarUrl?: string;
  totalCalls: number;
  winRate?: number;
  avgRoi?: number;
  score?: number;
  totalMcapCalled?: number;
  rewardTier?: "Diamond" | "Gold" | "Silver";
  estimatedRewardBaton?: number;
  recentTokens?: string[];
  rawPumpData?: Record<string, unknown>;
}

export interface CalloutApiError {
  source: string;
  status?: number;
  message: string;
}

export interface CalloutsApiResponse {
  updatedAt: number;
  source: string;
  callouts: CalloutCard[];
  topCallers: TopCaller[];
  errors: CalloutApiError[];
  authRequired?: boolean;
}
