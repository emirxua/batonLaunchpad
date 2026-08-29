import { NextResponse } from "next/server";

export const revalidate = 30;

interface DexBoostItem {
  chainId?: string;
  tokenAddress?: string;
}

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
  volume?: {
    h24?: number;
  };
  priceChange?: {
    h24?: number;
  };
  liquidity?: {
    usd?: number;
  };
  info?: {
    imageUrl?: string;
  };
}

export async function GET() {
  try {
    const boostRes = await fetch("https://api.dexscreener.com/token-boosts/top/v1", {
      next: { revalidate: 30 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!boostRes.ok) throw new Error("DexScreener boosts error");
    const boosts = (await boostRes.json()) as DexBoostItem[];

    const solanaTokens = (Array.isArray(boosts) ? boosts : [])
      .filter((b) => b.chainId === "solana" && b.tokenAddress)
      .map((b) => b.tokenAddress!)
      .slice(0, 25);

    if (solanaTokens.length === 0) {
      return NextResponse.json({ success: true, count: 0, tokens: [] });
    }

    const pairsRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${solanaTokens.join(",")}`,
      {
        next: { revalidate: 30 },
        headers: {
          Accept: "application/json",
        },
      }
    );

    const pairsData = await pairsRes.json();
    const pairs: DexPair[] = Array.isArray(pairsData.pairs) ? pairsData.pairs : [];

    // Market cap >= $70,000 filter and deduplication by mint
    const tokenMap = new Map();
    for (const p of pairs) {
      if (p.chainId !== "solana") continue;
      const mcap = p.marketCap || p.fdv || 0;
      if (mcap < 70000) continue;
      const mint = p.baseToken?.address;
      if (!mint) continue;

      const item = {
        mint,
        name: p.baseToken?.name || p.baseToken?.symbol || mint.slice(0, 6),
        symbol: p.baseToken?.symbol || "TOKEN",
        priceUsd: parseFloat(p.priceUsd || "0"),
        marketCap: mcap,
        volume24h: p.volume?.h24 || 0,
        priceChange24h: p.priceChange?.h24 || 0,
        liquidityUsd: p.liquidity?.usd || 0,
        iconUrl: p.info?.imageUrl || null,
      };

      const existing = tokenMap.get(mint);
      if (!existing || item.liquidityUsd > existing.liquidityUsd) {
        tokenMap.set(mint, item);
      }
    }

    const filteredTokens = Array.from(tokenMap.values());

    return NextResponse.json({
      success: true,
      count: filteredTokens.length,
      tokens: filteredTokens,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Trending fetch error";
    return NextResponse.json(
      { success: false, count: 0, tokens: [], error: message },
      { status: 500 }
    );
  }
}
