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

    const minMcapParam = parseFloat(searchParams.get("minMcap") || "70000");
    const minMcap = isNaN(minMcapParam) ? 70_000 : Math.max(0, minMcapParam);

    const sortBy = searchParams.get("sortBy") || "trending";

    // 1. Fetch real trending Solana tokens with >= $70,000 market cap and >= $5,000 liquidity
    const tokens = await fetchDexTrendingTokens(minMcap, 5_000, sortBy);

    // 2. Apply limit
    const slicedTokens: DexTrendingToken[] = tokens.slice(0, limit);

    return NextResponse.json(
      {
        success: true,
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
        success: false,
        updatedAt: Date.now(),
        count: 0,
        tokens: [],
        error: message,
      },
      { status: 500 }
    );
  }
}
