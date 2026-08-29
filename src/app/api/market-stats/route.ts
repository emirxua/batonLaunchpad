import { NextResponse } from "next/server";

export const revalidate = 15;

interface AssetMapItem {
  symbol: string;
  name: string;
  pair: string;
}

interface MarketStatsResult {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

const ASSET_MAP: AssetMapItem[] = [
  { symbol: "SOL", name: "Solana", pair: "SOLUSD" },
  { symbol: "BTC", name: "Bitcoin", pair: "XBTUSD" },
  { symbol: "ETH", name: "Ethereum", pair: "ETHUSD" },
  { symbol: "BNB", name: "BNB Chain", pair: "BNBUSD" },
];

let lastGoodStats: MarketStatsResult[] = [];

export async function GET() {
  try {
    const results = await Promise.all(
      ASSET_MAP.map(async (asset) => {
        try {
          // Kraken OHLC (interval=60 dk -> saatlik mumlar)
          const res = await fetch(
            `https://api.kraken.com/0/public/OHLC?pair=${asset.pair}&interval=60`,
            {
              headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
              next: { revalidate: 30 },
            }
          );

          if (!res.ok) throw new Error(`Kraken error ${res.status}`);
          const json = await res.json();
          const pairKey = Object.keys(json?.result || {}).find((k) => k !== "last");
          const rawCandles = pairKey ? json.result[pairKey] : [];

          // Kraken OHLC format: [time, open, high, low, close, vwap, volume, count]
          // Son 24 saatin kapanış fiyatları (close = index 4)
          const sparkline: number[] = Array.isArray(rawCandles)
            ? rawCandles
                .slice(-24)
                .map((c: unknown[]) => parseFloat(String(c[4])))
                .filter((p: number) => !isNaN(p) && p > 0)
            : [];

          const currentPrice =
            sparkline.length > 0 ? sparkline[sparkline.length - 1] : 0;
          const open24h = sparkline.length > 0 ? sparkline[0] : currentPrice;
          const priceChangePercent24h =
            open24h > 0 ? ((currentPrice - open24h) / open24h) * 100 : 0;

          // Hacim hesabı
          const lastCandle = rawCandles[rawCandles.length - 1] || [];
          const volume24h =
            parseFloat(lastCandle[6] || "0") * currentPrice * 24 || 50000000;

          return {
            symbol: asset.symbol,
            name: asset.name,
            price: currentPrice,
            priceChangePercent24h: priceChangePercent24h,
            volume24h: volume24h,
            sparkline: sparkline.length >= 2 ? sparkline : [],
          };
        } catch {
          const cached = lastGoodStats.find((c) => c.symbol === asset.symbol);
          return cached || null;
        }
      })
    );

    const valid = results.filter(
      (r): r is MarketStatsResult => r !== null && r.price > 0
    );

    if (valid.length > 0) {
      lastGoodStats = valid;
    }

    return NextResponse.json({
      success: true,
      data: valid.length > 0 ? valid : lastGoodStats,
    });
  } catch (e: unknown) {
    if (lastGoodStats.length > 0) {
      return NextResponse.json({ success: true, data: lastGoodStats });
    }
    const message = e instanceof Error ? e.message : "Kraken market error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
