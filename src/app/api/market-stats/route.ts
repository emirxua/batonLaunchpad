import { NextResponse } from "next/server";
import { fetchAllBinanceMarkets } from "@/lib/api/binance";
import { BinanceMarketData } from "@/lib/types/terminal";

// Next.js ISR: Cache on server for 45 seconds
export const revalidate = 45;

let lastGoodMarketStats: BinanceMarketData[] | null = null;

export async function GET() {
  try {
    const data = await fetchAllBinanceMarkets();

    if (data && data.length > 0) {
      lastGoodMarketStats = data;

      return NextResponse.json(
        {
          updatedAt: Date.now(),
          data,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
          },
        }
      );
    }

    // If fetch failed but we have last good data in memory, serve it
    if (lastGoodMarketStats && lastGoodMarketStats.length > 0) {
      return NextResponse.json(
        {
          updatedAt: Date.now(),
          data: lastGoodMarketStats,
          warning: "Serving cached market rates",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90",
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch market data from Binance / CoinGecko",
      },
      { status: 502 }
    );
  } catch (err: unknown) {
    if (lastGoodMarketStats && lastGoodMarketStats.length > 0) {
      return NextResponse.json(
        {
          updatedAt: Date.now(),
          data: lastGoodMarketStats,
        },
        { status: 200 }
      );
    }

    const message =
      err instanceof Error ? err.message : "Unknown error fetching market stats";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 502 }
    );
  }
}
