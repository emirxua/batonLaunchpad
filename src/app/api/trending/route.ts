import { NextResponse } from "next/server";

export const revalidate = 30;

interface DexPair {
  chainId?: string;
  pairAddress?: string;
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

// in-memory stale cache
let lastGoodTokens: unknown[] = [];

async function fetchTrendingPairs(sortBy: string, limit: number, minMcap: number) {
  // Strategy 1: DexScreener Solana trending pairs via search (gerçek anlık trend)
  const trendingRes = await fetch(
    "https://api.dexscreener.com/latest/dex/search?q=solana",
    {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    }
  );

  if (!trendingRes.ok) throw new Error(`DexScreener search failed: ${trendingRes.status}`);

  const trendingData = await trendingRes.json();
  const pairs: DexPair[] = Array.isArray(trendingData?.pairs)
    ? trendingData.pairs
    : [];

  // Deduplicate by baseToken.address (highest liquidity pair wins)
  const tokenMap = new Map<
    string,
    {
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
  >();

  for (const p of pairs) {
    if (p.chainId !== "solana") continue;
    const mint = p.baseToken?.address;
    if (!mint) continue;

    const mcap = p.marketCap ?? p.fdv ?? 0;
    if (mcap < minMcap) continue;

    const liquidityUsd = p.liquidity?.usd ?? 0;
    const existing = tokenMap.get(mint);

    if (!existing || liquidityUsd > existing.liquidityUsd) {
      tokenMap.set(mint, {
        mint,
        name: p.baseToken?.name ?? p.baseToken?.symbol ?? mint.slice(0, 6),
        symbol: p.baseToken?.symbol ?? "TOKEN",
        priceUsd: parseFloat(p.priceUsd ?? "0"),
        marketCap: mcap,
        volume24h: p.volume?.h24 ?? 0,
        priceChange24h: p.priceChange?.h24 ?? 0,
        liquidityUsd,
        iconUrl: p.info?.imageUrl ?? null,
      });
    }
  }

  let results = Array.from(tokenMap.values());

  // Sort
  if (sortBy === "gainers") {
    results = results.sort((a, b) => b.priceChange24h - a.priceChange24h);
  } else if (sortBy === "volume") {
    results = results.sort((a, b) => b.volume24h - a.volume24h);
  } else {
    // trending: sort by volume (DexScreener returns by relevance but we re-sort by volume)
    results = results.sort((a, b) => b.volume24h - a.volume24h);
  }

  return results.slice(0, limit);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 50);
  const minMcap = parseInt(searchParams.get("minMcap") ?? "70000");
  const sortBy = searchParams.get("sortBy") ?? "trending";

  try {
    const tokens = await fetchTrendingPairs(sortBy, limit, minMcap);

    if (tokens.length > 0) {
      lastGoodTokens = tokens;
    }

    return NextResponse.json({
      success: true,
      count: tokens.length,
      tokens: tokens.length > 0 ? tokens : lastGoodTokens,
    });
  } catch (err: unknown) {
    if (lastGoodTokens.length > 0) {
      return NextResponse.json({
        success: true,
        count: lastGoodTokens.length,
        tokens: lastGoodTokens,
      });
    }
    const message = err instanceof Error ? err.message : "Trending fetch error";
    return NextResponse.json(
      { success: false, count: 0, tokens: [], error: message },
      { status: 500 }
    );
  }
}
