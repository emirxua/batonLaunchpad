import { BinanceMarketData } from "@/lib/types/terminal";

export const DEFAULT_BINANCE_SYMBOLS = [
  "SOLUSDT",
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
];

export interface RawBinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
  highPrice: string;
  lowPrice: string;
}

/**
 * Fetches 24h ticker for a single symbol from Binance REST API.
 */
export async function fetchSingleBinanceTicker(
  symbol: string
): Promise<RawBinanceTicker | null> {
  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(
      symbol
    )}`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 45 },
    });

    if (!res.ok) {
      console.warn(`Binance ticker API returned status ${res.status} for ${symbol}`);
      return null;
    }

    const data = (await res.json()) as RawBinanceTicker;
    if (!data || !data.lastPrice) {
      return null;
    }

    return data;
  } catch (err) {
    console.warn(`fetchSingleBinanceTicker error for ${symbol}:`, err);
    return null;
  }
}

/**
 * Fetches 1h interval klines (candlesticks) for the past 24 hours from Binance.
 * Extracts index 4 (Close Price) into a 24-number array for sparkline charts.
 */
export async function fetchBinanceKlines(symbol: string): Promise<number[]> {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(
      symbol
    )}&interval=1h&limit=24`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 45 },
    });

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as Array<Array<string | number>>;
    if (!Array.isArray(data)) {
      return [];
    }

    const sparkline = data
      .map((k) => parseFloat(String(k[4])))
      .filter((n) => !isNaN(n));

    return sparkline;
  } catch (err) {
    console.warn(`fetchBinanceKlines error for ${symbol}:`, err);
    return [];
  }
}

/**
 * Fallback to CoinGecko public API if Binance is temporarily blocked.
 */
async function fetchCoinGeckoFallback(): Promise<Record<string, { usd: number; usd_24h_change: number; usd_24h_vol: number }>> {
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum,binancecoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

const COINGECKO_MAP: Record<string, string> = {
  SOLUSDT: "solana",
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  BNBUSDT: "binancecoin",
};

/**
 * Combines 24h ticker data with 24h klines sparkline for all tracked symbols.
 * Uses Promise.allSettled so individual failures don't block other symbols.
 * Includes CoinGecko fallback for resilience.
 */
export async function fetchAllBinanceMarkets(
  symbols: string[] = DEFAULT_BINANCE_SYMBOLS
): Promise<BinanceMarketData[]> {
  try {
    // 1. Parallel fetch tickers and klines for all symbols
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        const [ticker, sparkline] = await Promise.all([
          fetchSingleBinanceTicker(symbol),
          fetchBinanceKlines(symbol),
        ]);

        return {
          symbol,
          ticker,
          sparkline,
        };
      })
    );

    const markets: BinanceMarketData[] = [];
    const missingSymbols: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const symbol = symbols[i];

      if (r.status === "fulfilled" && r.value.ticker) {
        const t = r.value.ticker;
        markets.push({
          symbol: t.symbol,
          price: parseFloat(t.lastPrice) || 0,
          priceChangePercent24h: parseFloat(t.priceChangePercent) || 0,
          volume24h: parseFloat(t.volume) || 0,
          high24h: parseFloat(t.highPrice) || 0,
          low24h: parseFloat(t.lowPrice) || 0,
          sparkline: r.value.sparkline,
        });
      } else {
        missingSymbols.push(symbol);
      }
    }

    // 2. If any symbols failed from Binance, use CoinGecko fallback
    if (missingSymbols.length > 0) {
      const geckoData = await fetchCoinGeckoFallback();

      for (const sym of missingSymbols) {
        const geckoId = COINGECKO_MAP[sym];
        const info = geckoId ? geckoData[geckoId] : null;

        if (info && info.usd) {
          markets.push({
            symbol: sym,
            price: info.usd,
            priceChangePercent24h: info.usd_24h_change || 0,
            volume24h: (info.usd_24h_vol || 0) / info.usd,
            high24h: info.usd,
            low24h: info.usd,
            sparkline: [],
          });
        }
      }
    }

    // Preserve the standard order: SOL, BTC, ETH, BNB
    markets.sort(
      (a, b) => symbols.indexOf(a.symbol) - symbols.indexOf(b.symbol)
    );

    return markets;
  } catch (err) {
    console.warn("fetchAllBinanceMarkets error:", err);
    return [];
  }
}
