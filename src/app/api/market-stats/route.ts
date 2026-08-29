import { NextResponse } from "next/server";

export const revalidate = 15;

interface CoinConfig {
  id: string;
  symbol: string;
  name: string;
  binanceSymbol: string;
}

interface MarketStatsItem {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

const TARGET_COINS: CoinConfig[] = [
  { id: "solana", symbol: "SOL", name: "Solana", binanceSymbol: "SOLUSDT" },
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", binanceSymbol: "BTCUSDT" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", binanceSymbol: "ETHUSDT" },
  { id: "binancecoin", symbol: "BNB", name: "BNB Chain", binanceSymbol: "BNBUSDT" },
];

let lastGoodStats: MarketStatsItem[] = [];

export async function GET() {
  try {
    // 4 Coini PARALEL VE BİRBİRİNDEN TAMAMEN BAĞIMSIZ ÇEK
    const dataPromises = TARGET_COINS.map(async (coin): Promise<MarketStatsItem | null> => {
      try {
        // 1. 24h Ticker Fiyat & Yüzde
        const tickerRes = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${coin.binanceSymbol}`,
          { next: { revalidate: 15 } }
        );
        const ticker = await tickerRes.json();

        // 2. Coinin KENDİNE ÖZEL 24 Saatlik Mumları
        const klineRes = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${coin.binanceSymbol}&interval=1h&limit=24`,
          { next: { revalidate: 30 } }
        );
        const klines = await klineRes.json();

        // Sadece bu coinin kapanış fiyatları
        const coinSparkline: number[] = Array.isArray(klines)
          ? klines.map((candle: [number, string, string, string, string]) => parseFloat(candle[4]))
          : [];

        return {
          symbol: coin.symbol,
          name: coin.name,
          price: parseFloat(ticker.lastPrice || "0"),
          priceChangePercent24h: parseFloat(ticker.priceChangePercent || "0"),
          volume24h: parseFloat(ticker.quoteVolume || "0"),
          sparkline: coinSparkline, // Her coinin kendi özel dizisi
        };
      } catch {
        // Yedek: Binance bloklarsa o coin için özel CoinGecko isteği
        try {
          const cgRes = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=1`,
            { next: { revalidate: 60 } }
          );
          const cgData = await cgRes.json();
          const prices: number[] = Array.isArray(cgData?.prices)
            ? cgData.prices.map((p: [number, number]) => p[1])
            : [];
          return {
            symbol: coin.symbol,
            name: coin.name,
            price: prices[prices.length - 1] || 0,
            priceChangePercent24h: 0,
            volume24h: 0,
            sparkline: prices.slice(-24),
          };
        } catch {
          return null;
        }
      }
    });

    const results = await Promise.all(dataPromises);
    const validData = results.filter((item): item is MarketStatsItem => Boolean(item && item.sparkline && item.sparkline.length > 0));

    if (validData.length > 0) {
      lastGoodStats = validData;
    }

    return NextResponse.json({
      success: true,
      data: validData.length > 0 ? validData : lastGoodStats,
    });
  } catch (err: unknown) {
    if (lastGoodStats.length > 0) {
      return NextResponse.json({ success: true, data: lastGoodStats });
    }
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
