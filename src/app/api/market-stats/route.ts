import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 15;

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string; // 24h volume in USDT
}

interface MarketStatsResult {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

const ASSET_MAP = [
  { symbol: "SOL", name: "Solana", binancePair: "SOLUSDT" },
  { symbol: "BTC", name: "Bitcoin", binancePair: "BTCUSDT" },
  { symbol: "ETH", name: "Ethereum", binancePair: "ETHUSDT" },
  { symbol: "BNB", name: "BNB Chain", binancePair: "BNBUSDT" },
];

const BINANCE_BASE = "https://api.binance.com";

async function fetchWithTimeout(url: string, ms = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  try {
    const pairs = ASSET_MAP.map((a) => `"${a.binancePair}"`).join(",");

    // 1. Fetch 24h ticker data for all pairs in one Binance call
    const tickerUrl = `${BINANCE_BASE}/api/v3/ticker/24hr?symbols=[${pairs}]`;
    const tickerRes = await fetchWithTimeout(tickerUrl);
    if (!tickerRes.ok) throw new Error(`Binance ticker error: ${tickerRes.status}`);
    const tickers: BinanceTicker[] = await tickerRes.json();

    // 2. Fetch 1h klines (last 24 candles) for sparklines — parallel per pair
    const klinePromises = ASSET_MAP.map(async (asset) => {
      try {
        const klineUrl = `${BINANCE_BASE}/api/v3/klines?symbol=${asset.binancePair}&interval=1h&limit=24`;
        const res = await fetchWithTimeout(klineUrl);
        if (!res.ok) return { pair: asset.binancePair, closes: [] as number[] };
        const klines: string[][] = await res.json();
        const closes = klines.map((k) => parseFloat(k[4])); // index 4 = close price
        return { pair: asset.binancePair, closes };
      } catch {
        return { pair: asset.binancePair, closes: [] as number[] };
      }
    });

    const klineResults = await Promise.all(klinePromises);
    const klineMap = Object.fromEntries(
      klineResults.map((r) => [r.pair, r.closes])
    );

    // 3. Assemble response
    const data: MarketStatsResult[] = ASSET_MAP.map((asset) => {
      const ticker = tickers.find((t) => t.symbol === asset.binancePair);
      const sparkline = klineMap[asset.binancePair] || [];

      return {
        symbol: asset.symbol,
        name: asset.name,
        price: ticker ? parseFloat(ticker.lastPrice) : 0,
        priceChangePercent24h: ticker ? parseFloat(ticker.priceChangePercent) : 0,
        volume24h: ticker ? parseFloat(ticker.quoteVolume) : 0,
        sparkline,
      };
    });

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (err) {
    console.error("[market-stats] Binance fetch failed:", err);

    // Return empty data — client shows skeleton, never fake prices
    return NextResponse.json(
      { success: false, data: [] },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
