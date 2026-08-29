import { NextResponse } from "next/server";

export const revalidate = 15;

interface MarketStatsItem {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

let lastGoodMarketStats: MarketStatsItem[] = [];

export async function GET() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=solana,bitcoin,ethereum,binancecoin&sparkline=true",
      {
        next: { revalidate: 15 },
        headers: { Accept: "application/json" },
      }
    );

    if (!res.ok) throw new Error(`CoinGecko HTTP error: ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid CoinGecko response payload");
    }

    const order = ["solana", "bitcoin", "ethereum", "binancecoin"];
    const symbolMap: Record<string, { display: string; name: string }> = {
      solana: { display: "SOL", name: "Solana" },
      bitcoin: { display: "BTC", name: "Bitcoin" },
      ethereum: { display: "ETH", name: "Ethereum" },
      binancecoin: { display: "BNB", name: "BNB Chain" },
    };

    const formatted: MarketStatsItem[] = order
      .map((id) => {
        const item = data.find((c: { id: string }) => c.id === id);
        if (!item) return null;
        return {
          symbol: symbolMap[id].display,
          name: symbolMap[id].name,
          price: item.current_price || 0,
          priceChangePercent24h: item.price_change_percentage_24h || 0,
          volume24h: item.total_volume || 0,
          sparkline: Array.isArray(item.sparkline_in_7d?.price)
            ? item.sparkline_in_7d.price.slice(-24).map(Number)
            : [],
        };
      })
      .filter((item): item is MarketStatsItem => item !== null);

    if (formatted.length > 0) {
      lastGoodMarketStats = formatted;
    }

    return NextResponse.json({
      success: true,
      data: formatted.length > 0 ? formatted : lastGoodMarketStats,
    });
  } catch (err: unknown) {
    if (lastGoodMarketStats.length > 0) {
      return NextResponse.json({ success: true, data: lastGoodMarketStats });
    }
    const message =
      err instanceof Error ? err.message : "Failed to fetch market stats";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
