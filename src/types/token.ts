export interface GlobalMarketItem {
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

export interface TrendingTokenItem {
  id: string;
  name: string;
  symbol: string;
  ca: string;
  price: number;
  priceFormatted: string;
  mcap: number;
  mcapFormatted: string;
  volume24h: number;
  volumeFormatted: string;
  volume6h?: number;
  volume6hFormatted?: string;
  priceChange24h: number;
  priceChangeFormatted: string;
  priceChange6h?: number;
  priceChange6hFormatted?: string;
  txns6h?: number;
  txns24h?: number;
  age?: string;
  liquidityUsd?: number;
  liquidityFormatted?: string;
  bondingCurveProgress: number;
  badge: string;
  iconUrl?: string;
  dexScreenerUrl?: string;
  dexId?: string;
}

export interface CalloutCallerItem {
  callerName: string;
  callerHandle: string;
  callerWallet?: string;
  callerAvatar: string;
  callerAvatarUrl?: string;
  callerXUsername?: string;
  callerBadge?: string;
  thesis: string;
  multiple: number;
  entryMcap: number;
  calloutPrice: number;
  timeAgo: string;
  createdAt?: number;
  likes?: number;
  calloutId?: string;
}

export interface CalloutItem {
  id: string;
  callerName: string;
  callerHandle: string;
  callerAvatar: string;
  callerAvatarUrl?: string;
  callerXUsername?: string;
  callerBadge?: string;
  tokenName: string;
  tokenSymbol: string;
  tokenCA: string;
  tokenIconUrl?: string;
  calloutPrice: number;
  currentPrice: number;
  entryMcap: number;
  currentMcap: number;
  multiplier: number;
  timeAgo: string;
  upvotes: number;
  callerWallet?: string;
  viewsCount?: number;
  commentCount?: number;
  batonBurned: number;
  burnRank?: number;
  thesis: string;
  calloutId?: string;
  createdAt?: number;
  callers?: CalloutCallerItem[];
}

export interface CommentItem {
  id: string;
  calloutId?: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorBadge?: string;
  sentiment: "BULLISH" | "BEARISH";
  commentText: string;
  timeAgo: string;
  upvotes: number;
}

export interface LeaderboardItem {
  rank: number;
  projectName: string;
  symbol: string;
  ca: string;
  totalBatonBurned: number;
  boostedBy: string;
  timeRemaining: string;
  mcap: number;
  mcapFormatted: string;
  volume24h: number;
  iconUrl?: string;
}
