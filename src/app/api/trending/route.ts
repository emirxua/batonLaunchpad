import { NextResponse } from "next/server";

export const revalidate = 30;

interface BoostItem {
  chainId?: string;
  tokenAddress?: string;
}

interface DexPair {
  chainId?: string;
  baseToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
}

interface TokenItem {
  mint: string;
  name: string;
  symbol: string;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidityUsd: number;
  iconUrl: string | null;
}

const STATIC_TRENDING_TOKENS: TokenItem[] = [
  {
    mint: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
    name: "Baton",
    symbol: "BATON",
    priceUsd: 0.0000348,
    marketCap: 348000,
    volume24h: 894000,
    priceChange24h: 42.15,
    liquidityUsd: 145000,
    iconUrl: "https://cdn.dexscreener.com/cms/images/B_1EShunz2lCb0jz?width=800&height=800&quality=95&format=auto",
  },
  {
    mint: "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
    name: "Fartcoin",
    symbol: "FARTCOIN",
    priceUsd: 0.384,
    marketCap: 384000000,
    volume24h: 48900000,
    priceChange24h: 18.4,
    liquidityUsd: 8400000,
    iconUrl: "https://dd.dexscreener.com/ds-data/tokens/solana/9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump.png",
  },
  {
    mint: "63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxc6kq",
    name: "Gigachad",
    symbol: "GIGA",
    priceUsd: 0.0542,
    marketCap: 520000000,
    volume24h: 32400000,
    priceChange24h: 8.92,
    liquidityUsd: 12100000,
    iconUrl: "https://dd.dexscreener.com/ds-data/tokens/solana/63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxc6kq.png",
  },
  {
    mint: "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
    name: "ai16z",
    symbol: "AI16Z",
    priceUsd: 0.428,
    marketCap: 468000000,
    volume24h: 39500000,
    priceChange24h: 12.6,
    liquidityUsd: 9400000,
    iconUrl: "https://dd.dexscreener.com/ds-data/tokens/solana/HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC.png",
  },
  {
    mint: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv",
    name: "Pudgy Penguins",
    symbol: "PENGU",
    priceUsd: 0.0385,
    marketCap: 285000000,
    volume24h: 19800000,
    priceChange24h: -3.2,
    liquidityUsd: 6800000,
    iconUrl: "https://dd.dexscreener.com/ds-data/tokens/solana/2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv.png",
  },
  {
    mint: "J3NKxxXZcnNiMjKw9hYb2K4KUfXPdd32G7C1SpMpump",
    name: "SPX6900",
    symbol: "SPX",
    priceUsd: 0.684,
    marketCap: 642000000,
    volume24h: 24500000,
    priceChange24h: 5.4,
    liquidityUsd: 14500000,
    iconUrl: "https://dd.dexscreener.com/ds-data/tokens/solana/J3NKxxXZcnNiMjKw9hYb2K4KUfXPdd32G7C1SpMpump.png",
  },
  {
    mint: "ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY",
    name: "Moo Deng",
    symbol: "MOODENG",
    priceUsd: 0.165,
    marketCap: 165000000,
    volume24h: 16400000,
    priceChange24h: 7.2,
    liquidityUsd: 4900000,
    iconUrl: "https://dd.dexscreener.com/ds-data/tokens/solana/ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY.png",
  },
  {
    mint: "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump",
    name: "Goatseus Maximus",
    symbol: "GOAT",
    priceUsd: 0.528,
    marketCap: 528000000,
    volume24h: 31200000,
    priceChange24h: -2.1,
    liquidityUsd: 11200000,
    iconUrl: "https://dd.dexscreener.com/ds-data/tokens/solana/CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump.png",
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get("sortBy") ?? "trending";

  let tokens = [...STATIC_TRENDING_TOKENS];

  if (sortBy === "gainers") {
    tokens = tokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
  } else if (sortBy === "volume") {
    tokens = tokens.sort((a, b) => b.volume24h - a.volume24h);
  }

  return NextResponse.json({
    success: true,
    count: tokens.length,
    tokens: tokens,
    data: tokens,
  });
}
