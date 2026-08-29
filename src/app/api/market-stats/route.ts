import { NextResponse } from "next/server";

export const revalidate = 20;

interface CoinGeckoMarketItem {
  id: string;
  symbol: string;
  name: string;
  current_price?: number;
  price_change_percentage_24h?: number;
  total_volume?: number;
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

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=solana,bitcoin,ethereum,binancecoin&sparkline=true",
      {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 20 },
      }
    );

    if (!res.ok) {
      if (lastGoodStats.length > 0) {
        return NextResponse.json({ success: true, data: lastGoodStats });
      }
      throw new Error(`CoinGecko fetch failed with status: ${res.status}`);
    }

    const data: CoinGeckoMarketItem[] = await res.json();

    const orderConfig = [
      { id: "solana", symbol: "SOL", name: "Solana" },
      { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
      { id: "ethereum", symbol: "ETH", name: "Ethereum" },
      { id: "binancecoin", symbol: "BNB", name: "BNB Chain" },
    ];

    const results: MarketStatsResult[] = orderConfig
      .map((target) => {
        const match = data.find((c) => c.id === target.id);
        if (!match) return null;

        // Her coin için bağımsız yeni array kopyası al (slice son 24 nokta)
        const rawPrices: number[] = Array.isArray(match.sparkline_in_7d?.price)
          ? [...match.sparkline_in_7d.price]
          : [];

        const sparkline24h =
          rawPrices.length >= 24
            ? rawPrices.slice(-24).map(Number)
            : rawPrices.map(Number);

        return {
          symbol: target.symbol,
          name: target.name,
          price: Number(match.current_price || 0),
          priceChangePercent24h: Number(match.price_change_percentage_24h || 0),
          volume24h: Number(match.total_volume || 0),
          sparkline: sparkline24h,
        };
      })
      .filter((item): item is MarketStatsResult => item !== null);

    if (results.length > 0) {
      lastGoodStats = results;
    }

    return NextResponse.json({
      success: true,
      data: results.length > 0 ? results : lastGoodStats,
    });
  } catch (error: unknown) {
    if (lastGoodStats.length > 0) {
      return NextResponse.json({ success: true, data: lastGoodStats });
    }
    const message = error instanceof Error ? error.message : "Failed to fetch market stats";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
