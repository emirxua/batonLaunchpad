import { NextResponse } from "next/server";
import {
  fetchBinanceTickers,
  fetchBinanceKlines,
  DEFAULT_BINANCE_SYMBOLS,
} from "@/lib/api/binance";
import { BinanceMarketData } from "@/lib/types/terminal";

// Next.js ISR: Cache on server for 45 seconds
export const revalidate = 45;

export async function GET() {
  try {
    const symbols = DEFAULT_BINANCE_SYMBOLS;

    // 1. Fetch 24h tickers from Binance
    const tickers = await fetchBinanceTickers(symbols);

    if (!tickers || tickers.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to fetch market data from Binance public API",
        },
        { status: 502 }
      );
    }

    // 2. Fetch 24h 1h klines (sparklines) in parallel for all symbols
    const data: BinanceMarketData[] = await Promise.all(
      tickers.map(async (t) => {
        const sparkline = await fetchBinanceKlines(t.symbol);
        return {
          symbol: t.symbol,
          price: parseFloat(t.lastPrice) || 0,
          priceChangePercent24h: parseFloat(t.priceChangePercent) || 0,
          volume24h: parseFloat(t.volume) || 0,
          high24h: parseFloat(t.highPrice) || 0,
          low24h: parseFloat(t.lowPrice) || 0,
          sparkline,
        };
      })
    );

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
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error fetching Binance stats";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 502 }
    );
  }
}
