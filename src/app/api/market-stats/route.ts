import { NextResponse } from "next/server";

export const revalidate = 30; // 30s ISR cache

interface MarketStatsItem {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

let lastGoodStats: MarketStatsItem[] = [];

export async function GET() {
  try {
    // Tek istekte 4 coinin fiyatını, 24s değişimini ve 7 günlük sparkline (son 24 noktası) çek
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=solana,bitcoin,ethereum,binancecoin&sparkline=true",
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      // Fallback: Binance US / Global multi-ticker (tek sorgu)
      const bRes = await fetch(
        'https://api.binance.com/api/v3/ticker/24hr?symbols=["SOLUSDT","BTCUSDT","ETHUSDT","BNBUSDT"]',
        { next: { revalidate: 30 } }
      );
      if (bRes.ok) {
        const bData = await bRes.json();
        const bMap: Record<string, { symbol: string; name: string }> = {
          SOLUSDT: { symbol: "SOL", name: "Solana" },
          BTCUSDT: { symbol: "BTC", name: "Bitcoin" },
          ETHUSDT: { symbol: "ETH", name: "Ethereum" },
          BNBUSDT: { symbol: "BNB", name: "BNB Chain" },
        };

        const fallbackData: MarketStatsItem[] = Array.isArray(bData)
          ? bData.map(
              (item: {
                symbol: string;
                lastPrice?: string;
                priceChangePercent?: string;
                quoteVolume?: string;
              }) => {
                const meta = bMap[item.symbol];
                const cached = lastGoodStats.find(
                  (c) => c.symbol === meta?.symbol
                );
                return {
                  symbol: meta?.symbol ?? item.symbol,
                  name: meta?.name ?? item.symbol,
                  price: parseFloat(item.lastPrice || "0"),
                  priceChangePercent24h: parseFloat(
                    item.priceChangePercent || "0"
                  ),
                  volume24h: parseFloat(item.quoteVolume || "0"),
                  // Son iyi sparkline verisini koru
                  sparkline:
                    cached?.sparkline && cached.sparkline.length >= 2
                      ? cached.sparkline
                      : [],
                };
              }
            )
          : [];

        if (fallbackData.length > 0) {
          lastGoodStats = fallbackData;
        }

        return NextResponse.json({
          success: true,
          data: fallbackData.length > 0 ? fallbackData : lastGoodStats,
        });
      }
      throw new Error(`Upstream API status: ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      if (lastGoodStats.length > 0) {
        return NextResponse.json({ success: true, data: lastGoodStats });
      }
      throw new Error("Empty payload from CoinGecko");
    }

    const order = ["solana", "bitcoin", "ethereum", "binancecoin"];
    const symbolMap: Record<string, { symbol: string; name: string }> = {
      solana: { symbol: "SOL", name: "Solana" },
      bitcoin: { symbol: "BTC", name: "Bitcoin" },
      ethereum: { symbol: "ETH", name: "Ethereum" },
      binancecoin: { symbol: "BNB", name: "BNB Chain" },
    };

    const formatted = order
      .map((id) => {
        const coin = data.find((c: { id: string }) => c.id === id);
        if (!coin) return null;

        // CoinGecko 7 günlük ~168 noktayı döner; son 24'ü = gerçek 24 saatlik mum dizisi
        const rawSparkline: number[] = coin.sparkline_in_7d?.price ?? [];
        const sparkline24h = rawSparkline.slice(-24);

        return {
          symbol: symbolMap[id].symbol,
          name: symbolMap[id].name,
          price: coin.current_price ?? 0,
          priceChangePercent24h: coin.price_change_percentage_24h ?? 0,
          volume24h: coin.total_volume ?? 0,
          sparkline: sparkline24h.length >= 2 ? sparkline24h : [],
        };
      })
      .filter(
        (item): item is MarketStatsItem =>
          item !== null && item.sparkline.length >= 2
      );

    if (formatted.length > 0) {
      lastGoodStats = formatted;
    }

    return NextResponse.json({
      success: true,
      data: formatted.length > 0 ? formatted : lastGoodStats,
    });
  } catch (err: unknown) {
    if (lastGoodStats.length > 0) {
      return NextResponse.json({ success: true, data: lastGoodStats });
    }
    const message =
      err instanceof Error ? err.message : "Failed to fetch market stats";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
