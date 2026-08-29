import { NextRequest, NextResponse } from "next/server";
import { fetchDexTrendingTokens } from "@/lib/api/dexscreener";
import { DexTrendingToken } from "@/lib/types/terminal";

// Next.js ISR: Cache this route on server for 60 seconds
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limitParam = parseInt(searchParams.get("limit") || "30", 10);
    const limit = Math.min(50, Math.max(1, isNaN(limitParam) ? 30 : limitParam));

    const minMcapParam = parseFloat(searchParams.get("minMcap") || "50000");
    const minMcap = isNaN(minMcapParam) ? 50_000 : Math.max(0, minMcapParam);

    const sortBy = searchParams.get("sortBy") || "volume";

    // 1. Fetch real trending Solana tokens with min market cap filter
    let tokens = await fetchDexTrendingTokens(minMcap, 1_000);

    // 2. Sort according to sortBy query parameter
    if (sortBy === "gainers") {
      tokens = [...tokens].sort((a, b) => b.priceChange24h - a.priceChange24h);
    } else {
      // Default: sort by 24h volume
      tokens = [...tokens].sort((a, b) => b.volume24h - a.volume24h);
    }

    // 3. Apply limit
    const slicedTokens: DexTrendingToken[] = tokens.slice(0, limit);

    return NextResponse.json(
      {
        updatedAt: Date.now(),
        count: slicedTokens.length,
        tokens: slicedTokens,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error fetching trending tokens";
    return NextResponse.json(
      {
        updatedAt: Date.now(),
        count: 0,
        tokens: [],
        error: message,
      },
      { status: 500 }
    );
  }
}
