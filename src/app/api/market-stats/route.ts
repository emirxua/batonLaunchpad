import { NextResponse } from "next/server";

export const revalidate = 30; // 30 saniye güvenli cache

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
    // Tek istekte 4 coinin fiyatını, yüzdesini, hacmini ve 7 günlük sparkline mumlarını al
    const url =
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=solana,bitcoin,ethereum,binancecoin&sparkline=true";

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      // Yedek Fallback: Binance tek toplu sorgu
      try {
        const bRes = await fetch(
          'https://api.binance.com/api/v3/ticker/24hr?symbols=["SOLUSDT","BTCUSDT","ETHUSDT","BNBUSDT"]',
          { next: { revalidate: 30 } }
        );
        if (bRes.ok) {
          const bData = await bRes.json();
          const bMap: Record<string, string> = {
            SOLUSDT: "SOL",
            BTCUSDT: "BTC",
            ETHUSDT: "ETH",
            BNBUSDT: "BNB",
          };
          const bNameMap: Record<string, string> = {
            SOLUSDT: "Solana",
            BTCUSDT: "Bitcoin",
            ETHUSDT: "Ethereum",
            BNBUSDT: "BNB Chain",
          };

          const fallbackList: MarketStatsItem[] = Array.isArray(bData)
            ? bData.map((item: { symbol: string; lastPrice?: string; priceChangePercent?: string; quoteVolume?: string }) => {
                const sym = bMap[item.symbol] || item.symbol;
                const cached = lastGoodStats.find((c) => c.symbol === sym);
                return {
                  symbol: sym,
                  name: bNameMap[item.symbol] || item.symbol,
                  price: parseFloat(item.lastPrice || "0"),
                  priceChangePercent24h: parseFloat(item.priceChangePercent || "0"),
                  volume24h: parseFloat(item.quoteVolume || "0"),
                  sparkline: cached?.sparkline && cached.sparkline.length > 0 ? cached.sparkline : [],
                };
              })
            : [];

          if (fallbackList.length > 0) {
            return NextResponse.json({ success: true, data: fallbackList });
          }
        }
      } catch {
        // Continue to check lastGoodStats
      }

      if (lastGoodStats.length > 0) {
        return NextResponse.json({ success: true, data: lastGoodStats });
      }

      throw new Error(`Upstream API failed: ${res.status}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      if (lastGoodStats.length > 0) {
        return NextResponse.json({ success: true, data: lastGoodStats });
      }
      throw new Error("Invalid response format from CoinGecko");
    }

    const order = ["solana", "bitcoin", "ethereum", "binancecoin"];
    const symbolMap: Record<string, { symbol: string; name: string }> = {
      solana: { symbol: "SOL", name: "Solana" },
      bitcoin: { symbol: "BTC", name: "Bitcoin" },
      ethereum: { symbol: "ETH", name: "Ethereum" },
      binancecoin: { symbol: "BNB", name: "BNB Chain" },
    };

    const formatted: MarketStatsItem[] = order
      .map((id) => {
        const coin = data.find((c: { id: string }) => c.id === id);
        if (!coin) return null;

        // Son 24 saatlik fiyat noktaları (CoinGecko 168 eleman döner, son 24'ünü alıyoruz)
        const rawSparkline: number[] = coin.sparkline_in_7d?.price || [];
        const sparkline24h = rawSparkline.slice(-24);

        return {
          symbol: symbolMap[id].symbol,
          name: symbolMap[id].name,
          price: coin.current_price || 0,
          priceChangePercent24h: coin.price_change_percentage_24h || 0,
          volume24h: coin.total_volume || 0,
          sparkline: sparkline24h.length >= 2 ? sparkline24h : [],
        };
      })
      .filter((item): item is MarketStatsItem => item !== null);

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
    const message = err instanceof Error ? err.message : "Failed to fetch market stats";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
