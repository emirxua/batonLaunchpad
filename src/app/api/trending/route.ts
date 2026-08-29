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

// Stale-while-revalidate in-memory cache
let lastGoodTokens: TokenItem[] = [];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const minMcap = parseInt(searchParams.get("minMcap") ?? "70000");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 50);
  const sortBy = searchParams.get("sortBy") ?? "trending";

  try {
    const boostRes = await fetch(
      "https://api.dexscreener.com/token-boosts/top/v1",
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 30 },
      }
    );

    if (!boostRes.ok) throw new Error("DexScreener boosts error");
    const boosts = (await boostRes.json()) as BoostItem[];

    const solanaAddresses = (Array.isArray(boosts) ? boosts : [])
      .filter((b) => b.chainId === "solana" && b.tokenAddress)
      .map((b) => b.tokenAddress as string)
      .slice(0, 30);

    if (solanaAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        count: lastGoodTokens.length,
        tokens: lastGoodTokens,
      });
    }

    const pairsRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${solanaAddresses.join(",")}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 30 },
      }
    );
    const pairsData = await pairsRes.json();
    const pairs: DexPair[] = Array.isArray(pairsData?.pairs)
      ? pairsData.pairs
      : [];

    // Deduplicate by mint — keep highest liquidity pair per token
    const tokenMap = new Map<string, TokenItem>();
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

    let tokens = Array.from(tokenMap.values());

    // Apply sort
    if (sortBy === "gainers") {
      tokens = tokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
    } else if (sortBy === "volume") {
      tokens = tokens.sort((a, b) => b.volume24h - a.volume24h);
    }
    // "trending" → preserve boost rank order (DexScreener boost list order)

    tokens = tokens.slice(0, limit);

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
