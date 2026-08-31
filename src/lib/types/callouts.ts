// ─── Ham Pump.fun API tipi (endpoint: /callout/list/{wallet}) ────────────────

export interface PumpCallout {
  calloutId: string;
  userId: string; // caller wallet address
  coinMint: string;
  marketCap: number; // at time of call, in USD
  calloutPrice: number; // SOL
  calloutPriceUsd: number;
  multiple: number; // current price / callout price
  createdAt: number; // unix ms
  maxPriceSol: number;
  maxPriceUsd: number;
  thesis: string | null;
  user_uuid: string;
  likes: number;
  hasLiked: boolean | null;
  hasReposted: boolean | null;
  repostCount: number;
  quoteCount: number;
  commentCount: number;
  replyCount: number;
  maxMultiplier: number;
  maxMultiplierAt: string | null; // ISO datetime
  viewCount: number;
  mediaUrl: string | null;
  quotedCalloutId: string | null;
  quotedCallout: PumpCallout | null;
  updates: unknown[];
  updateCount: number;
}

export interface PumpCalloutListResponse {
  callouts: PumpCallout[];
  nextPageToken: string;
}

// ─── UI / enriched type ──────────────────────────────────────────────────────

export interface CalloutCard extends PumpCallout {
  callerWallet: string;   // = userId
  callerLabel: string;    // human label from watchlist
  callerAvatarUrl?: string; // real pump.fun profile avatar
  callerXUsername?: string; // real pump.fun Twitter/X handle
  coinSymbol?: string;
  coinName?: string;
}

// ─── API route response shape ────────────────────────────────────────────────

export interface WatchedSummary {
  wallet: string;
  label: string;
  count: number;
}

export interface CalloutError {
  wallet: string;
  status?: number;
  message: string;
  /** First 200 chars of the upstream body — only present when all fallbacks return non-2xx */
  bodySnippet?: string;
  /** Cloudflare Ray ID from the cf-ray header — helps trace WAF blocks */
  cfRay?: string | null;
}

export interface CalloutsApiResponse {
  updatedAt: number;
  watched: WatchedSummary[];
  callouts: CalloutCard[];
  emptyWallets: string[];
  errors: CalloutError[];
}
