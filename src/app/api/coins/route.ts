import { NextResponse } from "next/server";
import { TRACKED_COINS } from "@/lib/tracked-coins";
import { getCoinsMarketData } from "@/lib/dexscreener";

export const dynamic = "force-dynamic";
export const revalidate = 30;

export async function GET() {
  try {
    const mintAddresses = TRACKED_COINS.map((c) => c.mintAddress);
    const coins = await getCoinsMarketData(mintAddresses);

    return NextResponse.json(
      {
        success: true,
        count: coins.length,
        data: coins,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=59",
        },
      }
    );
  } catch (error) {
    console.error("API /api/coins error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch coins data from DexScreener",
      },
      { status: 500 }
    );
  }
}
