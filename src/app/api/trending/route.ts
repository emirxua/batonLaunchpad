import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEX_BASE = "https://api.dexscreener.com";

interface DexPair {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  pairCreatedAt?: number;
  url?: string;
  baseToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  volume?: { h24?: number; h6?: number; h1?: number; m5?: number };
  priceChange?: { h24?: number; h6?: number; h1?: number; m5?: number };
  txns?: {
    m5?: { buys?: number; sells?: number };
    h1?: { buys?: number; sells?: number };
    h6?: { buys?: number; sells?: number };
    h24?: { buys?: number; sells?: number };
  };
  liquidity?: { usd?: number };
  info?: { imageUrl?: string; header?: string };
}

export interface TokenItem {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  priceUsd: number;
  price: number;
  priceFormatted: string;
  marketCap: number;
  mcap: number;
  mcapFormatted: string;
  volume24h: number;
  volumeFormatted: string;
  volume6h: number;
  volume6hFormatted: string;
  priceChange24h: number;
  priceChangeFormatted: string;
  priceChange6h: number;
  priceChange6hFormatted: string;
  txns6h: number;
  txns24h: number;
  age: string;
  liquidityUsd: number;
  liquidityFormatted: string;
  iconUrl: string;
  pairAddress?: string;
  dexScreenerUrl: string;
  dexId: string;
  bondingCurveProgress: number;
  badge: string;
}

function formatCoinAge(createdAt?: number): string {
  if (!createdAt || isNaN(createdAt)) return "New";
  const diffMs = Date.now() - createdAt;
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  return `${years}y`;
}

// Popular verified Solana Trending mints to track and fetch in 1 single batch request
const TOP_SOLANA_TRENDING_MINTS = [
  "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump", // $BATON
  "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", // $POPCAT
  "61V8vBaqAGMpgDQi4JbgDR1dhGFytTCYkh5WwZRXpump", // $CHILLGUY
  "ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY", // $MOODENG
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", // $WIF
  "MEFNBXixkEbait3xn9bkm8FsBp2PCqU2giEg2KXpump", // $MEF
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // $BONK
  "A8C3xuqscfmyLrte3VmTqrAq8kgMASius9AFNANwpump", // $FWOG
  "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC", // $AI16Z
  "Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump", // $CHEX
  "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82", // $BOME
  "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump", // $GOAT
  "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump", // $FARTCOIN
  "8x5VqbHA8D7NkD52uNuS5nnt3PwA8pLD34ymskeSo2Wn", // $ZEREBRO
  "H3yqG7R18hCj2tU242sD7bL1K6F49kY5K5N88p7Jpump", // $SPX
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // $RAY
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",  // $JUP
  "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",  // $ORCA
  "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",  // $RENDER
  "Grass7B4RdKfBCjTKgSqnXkqjwiG6ep2U928xQWpump", // $GRASS
];

// Persistent in-memory cache to guarantee fast response
let persistentTrendingCache: TokenItem[] = [];
let lastFetchTimestamp = 0;

async function fetchTrendingBatch(): Promise<TokenItem[]> {
  try {
    // Top Solana trending mints + dynamic boosts
    const mintsToFetch = [
      "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump", // $BATON
      ...TOP_SOLANA_TRENDING_MINTS.filter((m) => m !== "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump"),
    ];

    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${DEX_BASE}/latest/dex/tokens/${mintsToFetch.join(",")}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(tid);

    if (!res.ok) {
      throw new Error(`DexScreener batch returned status ${res.status}`);
    }

    const data = await res.json();
    const pairs: DexPair[] = Array.isArray(data?.pairs) ? data.pairs : [];

    const tokenMap = new Map<string, TokenItem>();

    for (const p of pairs) {
      if (p.chainId !== "solana" || !p.baseToken?.address) continue;
      const mint = p.baseToken.address;
      const mcap = p.marketCap ?? p.fdv ?? 0;
      const vol24h = p.volume?.h24 ?? 0;
      const vol6h = p.volume?.h6 ?? (vol24h * 0.35);

      // If token already present, prefer higher liquidity pair
      if (tokenMap.has(mint)) {
        const existing = tokenMap.get(mint)!;
        if ((p.liquidity?.usd || 0) <= existing.liquidityUsd) continue;
      }

      const priceUsd = parseFloat(p.priceUsd || "0") || 0;
      const change24h = p.priceChange?.h24 ?? 0;
      const change6h = p.priceChange?.h6 ?? (change24h * 0.4);
      const txns6h = (p.txns?.h6?.buys || 0) + (p.txns?.h6?.sells || 0);
      const txns24h = (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0);
      const age = formatCoinAge(p.pairCreatedAt);
      const liq = p.liquidity?.usd ?? 0;
      const dexId = (p.dexId || "PUMPSWAP").toUpperCase();
      const symbol = (p.baseToken.symbol || "TOKEN").toUpperCase().slice(0, 10);
      const name = (p.baseToken.name || symbol).slice(0, 28);

      const isBaton = mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
      const iconUrl = isBaton
        ? "/images/baton-logo.png"
        : (p.info?.imageUrl || "");

      tokenMap.set(mint, {
        id: `token-${mint}`,
        mint,
        name,
        symbol,
        priceUsd,
        price: priceUsd,
        priceFormatted: priceUsd < 0.00001
          ? `$${priceUsd.toFixed(8)}`
          : priceUsd < 0.01
          ? `$${priceUsd.toFixed(6)}`
          : priceUsd < 1
          ? `$${priceUsd.toFixed(4)}`
          : `$${priceUsd.toFixed(2)}`,
        marketCap: mcap,
        mcap,
        mcapFormatted: mcap >= 1e6 ? `$${(mcap / 1e6).toFixed(1)}M` : `$${(mcap / 1e3).toFixed(0)}K`,
        volume24h: vol24h,
        volumeFormatted: vol24h >= 1e6 ? `$${(vol24h / 1e6).toFixed(1)}M` : `$${(vol24h / 1e3).toFixed(0)}K`,
        volume6h: vol6h,
        volume6hFormatted: vol6h >= 1e6 ? `$${(vol6h / 1e6).toFixed(1)}M` : `$${(vol6h / 1e3).toFixed(0)}K`,
        priceChange24h: change24h,
        priceChangeFormatted: `${change24h >= 0 ? "+" : ""}${change24h.toFixed(1)}%`,
        priceChange6h: change6h,
        priceChange6hFormatted: `${change6h >= 0 ? "+" : ""}${change6h.toFixed(1)}%`,
        txns6h,
        txns24h,
        age,
        liquidityUsd: liq,
        liquidityFormatted: liq >= 1e6 ? `$${(liq / 1e6).toFixed(1)}M` : `$${(liq / 1e3).toFixed(0)}K`,
        iconUrl,
        pairAddress: p.pairAddress,
        dexScreenerUrl: p.url || `https://dexscreener.com/solana/${p.pairAddress || mint}`,
        dexId,
        bondingCurveProgress: 100,
        badge: isBaton ? "Core Token" : change6h >= 50 ? "Breakout" : vol6h >= 500_000 ? "Top Vol" : "Trending",
      });
    }

    const items = Array.from(tokenMap.values());
    if (items.length > 0) {
      items.sort((a, b) => {
        if (a.mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump") return -1;
        if (b.mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump") return 1;
        return (b.volume6h || b.volume24h) - (a.volume6h || a.volume24h);
      });

      persistentTrendingCache = items;
      lastFetchTimestamp = Date.now();
      return items;
    }
  } catch (err) {
    console.warn("[trending] Batch fetch error:", err);
  }

  return persistentTrendingCache;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get("sortBy") ?? "trending";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 60);

  const now = Date.now();
  // Continuous live refresh: 2.5s cache max
  if (persistentTrendingCache.length > 0 && now - lastFetchTimestamp < 2_500) {
    let tokens = [...persistentTrendingCache];
    if (sortBy === "gainers") {
      tokens = tokens.sort((a, b) => (b.priceChange6h || b.priceChange24h) - (a.priceChange6h || a.priceChange24h));
    } else if (sortBy === "volume") {
      tokens = tokens.sort((a, b) => (b.volume6h || b.volume24h) - (a.volume6h || a.volume24h));
    }
    tokens = tokens.slice(0, limit);

    return NextResponse.json({
      success: true,
      updatedAt: lastFetchTimestamp,
      count: tokens.length,
      tokens,
      data: tokens,
    });
  }

  const tokens = await fetchTrendingBatch();
  let result = [...tokens];
  if (sortBy === "gainers") {
    result = result.sort((a, b) => (b.priceChange6h || b.priceChange24h) - (a.priceChange6h || a.priceChange24h));
  } else if (sortBy === "volume") {
    result = result.sort((a, b) => (b.volume6h || b.volume24h) - (a.volume6h || a.volume24h));
  }
  result = result.slice(0, limit);

  return NextResponse.json({
    success: true,
    updatedAt: lastFetchTimestamp || Date.now(),
    count: result.length,
    tokens: result,
    data: result,
  });
}
