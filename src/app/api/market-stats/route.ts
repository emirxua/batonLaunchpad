import { NextResponse } from "next/server";

export const revalidate = 15;

interface AssetMapItem {
  symbol: string;
  name: string;
  pair: string;
}

interface MarketStatsResult {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

const ASSET_MAP: AssetMapItem[] = [
  { symbol: "SOL", name: "Solana", pair: "SOLUSD" },
  { symbol: "BTC", name: "Bitcoin", pair: "XBTUSD" },
  { symbol: "ETH", name: "Ethereum", pair: "ETHUSD" },
  { symbol: "BNB", name: "BNB Chain", pair: "BNBUSD" },
];

export async function GET() {
  const staticStats: MarketStatsResult[] = [
    {
      symbol: "SOL",
      name: "Solana",
      price: 142.85,
      priceChangePercent24h: 4.82,
      volume24h: 3450000000,
      sparkline: [136.2, 137.5, 136.9, 138.4, 139.1, 140.2, 139.8, 141.5, 142.0, 141.2, 142.85],
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      price: 64250.0,
      priceChangePercent24h: 2.15,
      volume24h: 28400000000,
      sparkline: [62800, 63100, 62900, 63400, 63800, 64100, 63950, 64250],
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      price: 2540.2,
      priceChangePercent24h: 1.45,
      volume24h: 14200000000,
      sparkline: [2480, 2495, 2510, 2505, 2525, 2530, 2540.2],
    },
    {
      symbol: "BNB",
      name: "BNB Chain",
      price: 585.6,
      priceChangePercent24h: 0.88,
      volume24h: 980000000,
      sparkline: [578, 580, 582, 579, 583, 585.6],
    },
  ];

  return NextResponse.json({
    success: true,
    data: staticStats,
  });
}
