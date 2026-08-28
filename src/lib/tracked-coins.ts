import { Coin } from "@/types/coin";
import { getBurnLevel } from "./burn-levels";

export interface TrackedCoinConfig {
  id: string;
  name: string;
  ticker: string;
  mintAddress: string;
  imageUrl?: string;
  headerUrl?: string;
  iconColor: string;
  category: string;
  description: string;
  website?: string;
  twitter?: string;
  viewsCount?: number;
  totalBurnedBaton: number;
  fallbackMarketCap: number;
  fallbackVolume24h: number;
  fallbackChange24h: number;
  fallbackPriceUsd: number;
  sparkline: number[];
}

/**
 * The verified, active projects on $BATON Outbid Directory.
 * Real $BATON CA on pump.fun is the official ecosystem asset.
 * Additional tokens are registered dynamically when submitted via /submit or upon on-chain burn.
 */
export const TRACKED_COINS: TrackedCoinConfig[] = [
  {
    id: "baton-primary",
    name: "Baton — The Premier Solana Burn Engine",
    ticker: "BATON",
    mintAddress: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
    imageUrl: "https://cdn.dexscreener.com/cms/images/B_1EShunz2lCb0jz?width=800&height=800&quality=95&format=auto",
    headerUrl: "https://cdn.dexscreener.com/cms/images/vVNqFVaQ0jWxKguy?width=1500&height=500&quality=95&format=auto",
    iconColor: "#ff3d7a",
    category: "Mascots",
    description: "Official Solana mascot directory and on-chain burn engine. Burn $BATON to overtake #1 rank.",
    website: "https://pump.fun/coin/2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
    twitter: "https://x.com/buybaton",
    viewsCount: 41194,
    totalBurnedBaton: 0,
    fallbackMarketCap: 12_435,
    fallbackVolume24h: 653,
    fallbackChange24h: 16.09,
    fallbackPriceUsd: 0.00001246,
    sparkline: [10, 12, 11, 14, 13, 16, 18],
  },
];

export function getFallbackCoins(): Coin[] {
  return TRACKED_COINS.map((tc) => ({
    id: tc.id,
    name: tc.name,
    ticker: tc.ticker,
    mintAddress: tc.mintAddress,
    imageUrl: tc.imageUrl,
    headerUrl: tc.headerUrl,
    iconColor: tc.iconColor,
    category: tc.category,
    description: tc.description,
    website: tc.website,
    twitter: tc.twitter,
    viewsCount: tc.viewsCount,
    priceUsd: tc.fallbackPriceUsd,
    marketCap: tc.fallbackMarketCap,
    volume24h: tc.fallbackVolume24h,
    change24h: tc.fallbackChange24h,
    sparkline: tc.sparkline,
    totalBurnedBaton: tc.totalBurnedBaton,
    burnLevel: getBurnLevel(tc.totalBurnedBaton),
    pairAddress: "5Wg14qETNz2xo1rBCCDUd7PyQKbKo2Luj8nmrtpwimMx",
  }));
}

/**
 * Dynamically register a newly submitted or burned community token
 */
export function addTrackedCoin(newCoin: TrackedCoinConfig) {
  const exists = TRACKED_COINS.some(
    (c) => c.mintAddress.toLowerCase() === newCoin.mintAddress.toLowerCase()
  );
  if (!exists) {
    TRACKED_COINS.push(newCoin);
  }
}
