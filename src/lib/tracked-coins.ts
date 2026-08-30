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
    imageUrl: "/images/baton-logo.png",
    headerUrl: "https://cdn.dexscreener.com/cms/images/vVNqFVaQ0jWxKguy?width=1500&height=500&quality=95&format=auto",
    iconColor: "#ff3d7a",
    category: "Mascots",
    description: "Official Solana mascot directory and on-chain burn engine. Burn $BATON to overtake #1 rank.",
    website: "https://pump.fun/coin/2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
    twitter: "https://x.com/buybaton",
    viewsCount: 0,
    totalBurnedBaton: 0,
    sparkline: [],
  },
];

export function getTrackedCoins(): Coin[] {
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
    viewsCount: tc.viewsCount || 0,
    priceUsd: 0,
    marketCap: 0,
    volume24h: 0,
    change24h: 0,
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
