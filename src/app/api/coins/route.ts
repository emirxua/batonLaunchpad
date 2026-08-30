import { NextResponse } from "next/server";
import { TRACKED_COINS } from "@/lib/tracked-coins";
import { getCoinsMarketData } from "@/lib/dexscreener";
import { Coin } from "@/types/coin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mints = TRACKED_COINS.map((c) => c.mintAddress);
    const coins: Coin[] = await getCoinsMarketData(mints);

    return NextResponse.json(
      {
        success: true,
        count: coins.length,
        data: coins,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("API /api/coins error:", error);
    return NextResponse.json({ success: false, count: 0, data: [] }, { status: 200 });
  }
}
