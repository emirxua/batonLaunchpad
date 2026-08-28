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
 * Real $BATON CA on pump.fun is the primary ecosystem token.
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
  {
    id: "fartcoin",
    name: "Fartcoin — Autonomous AI Meme Agent",
    ticker: "FARTCOIN",
    mintAddress: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
    imageUrl: "https://pump.mypinata.cloud/ipfs/QmZ8XQ8k5pQ7hF21YfPjZ5eF4aR8yQ4oZ8k5pQ7hF21YfP",
    iconColor: "#a855f7",
    category: "Agents",
    description: "Terminal of Truths conversational meme AI agent creating high viral engagement across crypto Twitter.",
    website: "https://pump.fun/coin/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
    twitter: "https://x.com/fartcoinofsol",
    viewsCount: 28410,
    totalBurnedBaton: 0,
    fallbackMarketCap: 380_000_000,
    fallbackVolume24h: 14_200_000,
    fallbackChange24h: 12.4,
    fallbackPriceUsd: 0.38,
    sparkline: [15, 18, 14, 22, 28, 35, 38],
  },
  {
    id: "zerebro",
    name: "Zerebro — Autonomous Neural Network",
    ticker: "ZEREBRO",
    mintAddress: "8x5VqbHA8D7NkD52uNuS5nnt3PwA8pLD34ymjejRpump",
    imageUrl: "https://cf-ipfs.com/ipfs/Qmd96W4d5pQ7hF21YfPjZ5eF4aR8yQ4oZ8k5pQ7hF21YfP",
    iconColor: "#06b6d4",
    category: "AI Agents",
    description: "Multi-model creative neural AI agent releasing music, art, and on-chain algorithmic artifacts.",
    website: "https://pump.fun/coin/8x5VqbHA8D7NkD52uNuS5nnt3PwA8pLD34ymjejRpump",
    twitter: "https://x.com/0xzerebro",
    viewsCount: 19450,
    totalBurnedBaton: 0,
    fallbackMarketCap: 120_000_000,
    fallbackVolume24h: 8_900_000,
    fallbackChange24h: -4.2,
    fallbackPriceUsd: 0.12,
    sparkline: [20, 19, 18, 16, 15, 13, 12],
  },
  {
    id: "goat",
    name: "Goatseus Maximus — Original AI Sovereign",
    ticker: "GOAT",
    mintAddress: "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuBg9Rpump",
    imageUrl: "https://pump.mypinata.cloud/ipfs/QmZ8XQ8k5pQ7hF21YfPjZ5eF4aR8yQ4oZ8k5pQ7hF21YfG",
    iconColor: "#eab308",
    category: "Memes",
    description: "The forefather of modern Solana AI culture and memetic mythos designed by autonomous prompts.",
    website: "https://pump.fun/coin/CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuBg9Rpump",
    viewsCount: 35120,
    totalBurnedBaton: 0,
    fallbackMarketCap: 450_000_000,
    fallbackVolume24h: 21_000_000,
    fallbackChange24h: 8.5,
    fallbackPriceUsd: 0.45,
    sparkline: [30, 32, 38, 41, 40, 44, 45],
  },
  {
    id: "bull",
    name: "Bullish Mascot — Solana Community Mascot",
    ticker: "BULL",
    mintAddress: "BullisHMascotSolanaTokenAddress1111111111111",
    imageUrl: "https://pump.mypinata.cloud/ipfs/QmZ8XQ8k5pQ7hF21YfPjZ5eF4aR8yQ4oZ8k5pQ7hF21YfB",
    iconColor: "#22c55e",
    category: "Community",
    description: "Decentralized pump.fun community mascot rallying holders around continuous burn events.",
    viewsCount: 8920,
    totalBurnedBaton: 0,
    fallbackMarketCap: 85_000,
    fallbackVolume24h: 3_400,
    fallbackChange24h: 24.8,
    fallbackPriceUsd: 0.000085,
    sparkline: [5, 6, 7, 8, 9, 11, 14],
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
 * Dynamically register a newly verified/approved community coin
 */
export function addTrackedCoin(newCoin: TrackedCoinConfig) {
  const exists = TRACKED_COINS.some(
    (c) => c.mintAddress.toLowerCase() === newCoin.mintAddress.toLowerCase()
  );
  if (!exists) {
    TRACKED_COINS.push(newCoin);
  }
}
