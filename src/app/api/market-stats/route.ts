import { NextResponse } from "next/server";

export const revalidate = 10;

interface MarketStatsItem {
  symbol: string;
  name: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  sparkline: number[];
}

let lastGoodMarketData: MarketStatsItem[] = [];

const symbolMap: Record<string, { name: string; display: string }> = {
  SOLUSDT: { name: "Solana", display: "SOL" },
  BTCUSDT: { name: "Bitcoin", display: "BTC" },
  ETHUSDT: { name: "Ethereum", display: "ETH" },
  BNBUSDT: { name: "BNB Chain", display: "BNB" },
};

export async function GET() {
  try {
    // 1. SOL, BTC, ETH, BNB için canlı fiyat ve 24h değişim verileri
    const pairsRes = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22SOLUSDT%22,%22BTCUSDT%22,%22ETHUSDT%22,%22BNBUSDT%22%5D',
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          Accept: "application/json",
        },
        next: { revalidate: 10 },
      }
    ).catch(() => null);

    let rawData: unknown[] = [];
    if (pairsRes && pairsRes.ok) {
      try {
        rawData = await pairsRes.json();
      } catch {
        rawData = [];
      }
    }

    // 2. Fallback: Eğer Binance yanıt vermezse CoinGecko açık API'sinden çek (asla 0 basma)
    if (!Array.isArray(rawData) || rawData.length === 0) {
      try {
        const cgRes = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=solana,bitcoin,ethereum,binancecoin&sparkline=true",
          {
            headers: {
              Accept: "application/json",
            },
            next: { revalidate: 30 },
          }
        );

        if (cgRes.ok) {
          const cgData = await cgRes.json();
          if (Array.isArray(cgData) && cgData.length > 0) {
            const mappedCG: MarketStatsItem[] = cgData.map((c: {
              symbol: string;
              name: string;
              current_price: number;
              price_change_percentage_24h?: number;
              total_volume?: number;
              sparkline_in_7d?: { price?: number[] };
            }) => ({
              symbol: c.symbol.toUpperCase(),
              name: c.name,
              price: Number(c.current_price) || 0,
              priceChangePercent24h: Number(c.price_change_percentage_24h) || 0,
              volume24h: Number(c.total_volume) || 0,
              sparkline: Array.isArray(c.sparkline_in_7d?.price)
                ? c.sparkline_in_7d.price.slice(-24).map(Number)
                : [],
            }));

            lastGoodMarketData = mappedCG;
            return NextResponse.json({ success: true, data: mappedCG });
          }
        }
      } catch (cgErr) {
        console.warn("CoinGecko fallback error:", cgErr);
      }

      // If both network requests failed, return last known good data
      if (lastGoodMarketData.length > 0) {
        return NextResponse.json({ success: true, data: lastGoodMarketData });
      }

      return NextResponse.json(
        { success: false, error: "Unable to retrieve live market rates" },
        { status: 502 }
      );
    }

    // 3. Binance verisini eşle ve 24 saatlik mumları ekle
    const formatted: MarketStatsItem[] = await Promise.all(
      (rawData as Record<string, string>[]).map(async (item) => {
        const info = symbolMap[item.symbol] || {
          name: item.symbol,
          display: item.symbol,
        };

        // Mum verisini çek
        let sparkline: number[] = [];
        try {
          const kRes = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${item.symbol}&interval=1h&limit=24`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                Accept: "application/json",
              },
              next: { revalidate: 60 },
            }
          );
          if (kRes.ok) {
            const klines = await kRes.json();
            if (Array.isArray(klines)) {
              sparkline = klines
                .map((k: (string | number)[]) => parseFloat(String(k[4])))
                .filter((n) => !isNaN(n));
            }
          }
        } catch {
          // Kline başarısızsa boş bırak
        }

        return {
          symbol: info.display,
          name: info.name,
          price: parseFloat(item.lastPrice || "0"),
          priceChangePercent24h: parseFloat(item.priceChangePercent || "0"),
          volume24h: parseFloat(item.quoteVolume || "0"),
          sparkline,
        };
      })
    );

    // Filter out invalid items
    const valid = formatted.filter((item) => item.price > 0);
    if (valid.length > 0) {
      lastGoodMarketData = valid;
    }

    return NextResponse.json({
      success: true,
      data: valid.length > 0 ? valid : lastGoodMarketData,
    });
  } catch (err: unknown) {
    if (lastGoodMarketData.length > 0) {
      return NextResponse.json({ success: true, data: lastGoodMarketData });
    }
    const message =
      err instanceof Error ? err.message : "Internal market route error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
