import { NextResponse } from "next/server";

export const revalidate = 20;

interface CoinGeckoItem {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  sparkline_in_7d?: {
    price?: number[];
  };
}

interface MarketStatsResult {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

let lastGoodStats: MarketStatsResult[] = [];

const TARGETS = [
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "binancecoin", symbol: "BNB", name: "BNB Chain" },
];

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=solana,bitcoin,ethereum,binancecoin&sparkline=true",
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 20 },
      }
    );

    if (!res.ok) {
      if (lastGoodStats.length > 0) {
        return NextResponse.json({ success: true, data: lastGoodStats });
      }
      throw new Error(`CoinGecko upstream status: ${res.status}`);
    }

    const data: CoinGeckoItem[] = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      if (lastGoodStats.length > 0) {
        return NextResponse.json({ success: true, data: lastGoodStats });
      }
      throw new Error("Empty payload from CoinGecko");
    }

    const mapped: MarketStatsResult[] = TARGETS.map((t) => {
      const item = data.find((c) => c.id === t.id);
      if (!item) return null;

      const rawPrices: number[] = item.sparkline_in_7d?.price || [];
      // Sadece o coine ait gerçek bağımsız son 24 saatlik mum dizisi
      const sparkline24h = rawPrices.slice(-24);

      return {
        symbol: t.symbol,
        name: t.name,
        price: item.current_price || 0,
        priceChangePercent24h: item.price_change_percentage_24h || 0,
        volume24h: item.total_volume || 0,
        sparkline: sparkline24h.length >= 2 ? sparkline24h : rawPrices.slice(0, 24),
      };
    }).filter((item): item is MarketStatsResult => item !== null);

    if (mapped.length > 0) {
      lastGoodStats = mapped;
    }

    return NextResponse.json({
      success: true,
      data: mapped.length > 0 ? mapped : lastGoodStats,
    });
  } catch (err: unknown) {
    if (lastGoodStats.length > 0) {
      return NextResponse.json({ success: true, data: lastGoodStats });
    }
    const message = err instanceof Error ? err.message : "Failed to fetch market stats";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
