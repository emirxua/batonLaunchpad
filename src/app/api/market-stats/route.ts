import { NextResponse } from "next/server";

export const revalidate = 15; // 15 saniye ISR

interface AssetConfig {
  symbol: string;
  name: string;
  coinbaseProduct: string;
  fallbackKucoinSymbol?: string;
}

interface MarketStatsResult {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

const ASSETS: AssetConfig[] = [
  { symbol: "SOL", name: "Solana", coinbaseProduct: "SOL-USD" },
  { symbol: "BTC", name: "Bitcoin", coinbaseProduct: "BTC-USD" },
  { symbol: "ETH", name: "Ethereum", coinbaseProduct: "ETH-USD" },
  { symbol: "BNB", name: "BNB Chain", coinbaseProduct: "", fallbackKucoinSymbol: "BNB-USDT" },
];

let lastGoodStats: MarketStatsResult[] = [];

export async function GET() {
  try {
    const results = await Promise.all(
      ASSETS.map(async (asset) => {
        try {
          if (asset.coinbaseProduct) {
            // 1. Coinbase Public 24h Stats (Fiyat, Hacim, Açılış)
            const statsRes = await fetch(
              `https://api.exchange.coinbase.com/products/${asset.coinbaseProduct}/stats`,
              {
                headers: { "User-Agent": "Mozilla/5.0" },
                next: { revalidate: 15 },
              }
            );

            if (!statsRes.ok) throw new Error("Coinbase stats error");
            const stats = await statsRes.json();
            const currentPrice = parseFloat(stats.last || "0");
            const openPrice = parseFloat(stats.open || "0");
            const priceChangePercent24h =
              openPrice > 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0;
            const volume24h = parseFloat(stats.volume || "0") * currentPrice;

            // 2. Coinbase Public Candles (Son 24 saat, 3600 sn aralık = 24 mum)
            const now = Math.floor(Date.now() / 1000);
            const oneDayAgo = now - 86400;
            const candlesRes = await fetch(
              `https://api.exchange.coinbase.com/products/${asset.coinbaseProduct}/candles?granularity=3600&start=${new Date(
                oneDayAgo * 1000
              ).toISOString()}&end=${new Date(now * 1000).toISOString()}`,
              {
                headers: { "User-Agent": "Mozilla/5.0" },
                next: { revalidate: 30 },
              }
            );

            let sparkline: number[] = [];
            if (candlesRes.ok) {
              const candles = await candlesRes.json();
              // Coinbase format: [time, low, high, open, close, volume] -> Kapanışları al ve eskisinden yeniye sırala
              if (Array.isArray(candles)) {
                sparkline = candles.map((c: unknown[]) => Number(c[4])).reverse();
              }
            }

            return {
              symbol: asset.symbol,
              name: asset.name,
              price: currentPrice,
              priceChangePercent24h,
              volume24h,
              sparkline: sparkline.length >= 2 ? sparkline : [],
            };
          } else {
            // BNB için KuCoin Public Candles (Coinbase listelemediği için)
            const kucoinRes = await fetch(
              `https://api.kucoin.com/api/v1/market/candles?type=1hour&symbol=${asset.fallbackKucoinSymbol}`,
              {
                headers: { "User-Agent": "Mozilla/5.0" },
                next: { revalidate: 30 },
              }
            );

            if (!kucoinRes.ok) throw new Error("KuCoin candles error");
            const kuData = await kucoinRes.json();
            const rawCandles = Array.isArray(kuData?.data) ? kuData.data : [];
            // KuCoin format: [time, open, close, high, low, volume, turnover]
            const sparkline = rawCandles
              .slice(0, 24)
              .map((c: unknown[]) => parseFloat(String(c[2])))
              .reverse();
            const currentPrice = sparkline[sparkline.length - 1] || 0;
            const openPrice = sparkline[0] || currentPrice;
            const priceChangePercent24h =
              openPrice > 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0;

            return {
              symbol: asset.symbol,
              name: asset.name,
              price: currentPrice,
              priceChangePercent24h,
              volume24h: 380000000,
              sparkline: sparkline.length >= 2 ? sparkline : [],
            };
          }
        } catch {
          const cached = lastGoodStats.find((c) => c.symbol === asset.symbol);
          return cached || null;
        }
      })
    );

    const validResults = results.filter(
      (r): r is MarketStatsResult => r !== null && r.price > 0
    );

    if (validResults.length > 0) {
      lastGoodStats = validResults;
    }

    return NextResponse.json({
      success: true,
      data: validResults.length > 0 ? validResults : lastGoodStats,
    });
  } catch (globalErr: unknown) {
    if (lastGoodStats.length > 0) {
      return NextResponse.json({ success: true, data: lastGoodStats });
    }
    const message =
      globalErr instanceof Error ? globalErr.message : "Market stats error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
