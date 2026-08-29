import { NextResponse } from "next/server";

export const revalidate = 10; // 10 seconds cache

const SYMBOLS = [
  { symbol: "SOLUSDT", name: "Solana", display: "SOL" },
  { symbol: "BTCUSDT", name: "Bitcoin", display: "BTC" },
  { symbol: "ETHUSDT", name: "Ethereum", display: "ETH" },
  { symbol: "BNBUSDT", name: "BNB Chain", display: "BNB" },
];

export async function GET() {
  try {
    const results = await Promise.all(
      SYMBOLS.map(async (item) => {
        try {
          // 1. 24h Ticker Fiyatı & Yüzdesi
          const tickerRes = await fetch(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${item.symbol}`,
            { next: { revalidate: 10 } }
          );
          const ticker = await tickerRes.json();

          // 2. 24 Saatlik 1h Mum Verileri (Klines)
          const klineRes = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${item.symbol}&interval=1h&limit=24`,
            { next: { revalidate: 60 } }
          );
          const klines = await klineRes.json();

          // Kapanış fiyatlarını (4. index) number dizisine dök
          const sparkline: number[] = Array.isArray(klines)
            ? klines
                .map((k: (string | number)[]) => parseFloat(String(k[4])))
                .filter((n) => !isNaN(n))
            : [];

          return {
            symbol: item.display,
            name: item.name,
            price: parseFloat(ticker.lastPrice || "0"),
            priceChangePercent24h: parseFloat(ticker.priceChangePercent || "0"),
            volume24h: parseFloat(ticker.quoteVolume || "0"),
            sparkline: sparkline.length >= 2 ? sparkline : [],
          };
        } catch (e) {
          console.warn(`Error fetching Binance stats for ${item.symbol}:`, e);
          return null;
        }
      })
    );

    const validData = results.filter(Boolean);
    return NextResponse.json({
      success: true,
      updatedAt: Date.now(),
      data: validData,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error fetching Binance stats";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
