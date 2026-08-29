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
 * Fetches 24h ticker statistics for target symbols from Binance public REST API.
 * Returns parsed numeric market data or empty array on error without any mock data.
 */
export async function fetchBinanceTickers(
  symbols: string[] = DEFAULT_BINANCE_SYMBOLS
): Promise<RawBinanceTicker[]> {
  try {
    const encodedSymbols = encodeURIComponent(JSON.stringify(symbols));
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodedSymbols}`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Binance ticker API returned status: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as RawBinanceTicker[];
    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (err) {
    console.warn("fetchBinanceTickers network error:", err);
    return [];
  }
}

/**
 * Fetches 1h interval klines (candlesticks) for the past 24 hours from Binance.
 * Extracts index 4 (Close Price) into a 24-number array for sparkline charts.
 * Returns empty array on error without any fake data.
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
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Binance klines API returned status: ${res.status}`);
      return [];
    }

    // Binance klines response: [ [openTime, open, high, low, close, volume, closeTime, ...], ... ]
    const data = (await res.json()) as Array<Array<string | number>>;
    if (!Array.isArray(data)) {
      return [];
    }

    const sparkline = data
      .map((k) => parseFloat(String(k[4])))
      .filter((n) => !isNaN(n));

    return sparkline;
  } catch (err) {
    console.warn(`fetchBinanceKlines network error for ${symbol}:`, err);
    return [];
  }
}

/**
 * Combines 24h ticker data with 24h klines sparkline for all tracked symbols.
 */
export async function fetchAllBinanceMarkets(
  symbols: string[] = DEFAULT_BINANCE_SYMBOLS
): Promise<BinanceMarketData[]> {
  try {
    const tickers = await fetchBinanceTickers(symbols);
    if (tickers.length === 0) {
      return [];
    }

    // Fetch sparklines in parallel for the symbols
    const markets = await Promise.all(
      tickers.map(async (t) => {
        const sparkline = await fetchBinanceKlines(t.symbol);
        return {
          symbol: t.symbol,
          price: parseFloat(t.lastPrice) || 0,
          priceChangePercent24h: parseFloat(t.priceChangePercent) || 0,
          volume24h: parseFloat(t.volume) || 0,
          high24h: parseFloat(t.highPrice) || 0,
          low24h: parseFloat(t.lowPrice) || 0,
          sparkline,
        };
      })
    );

    return markets;
  } catch (err) {
    console.warn("fetchAllBinanceMarkets error:", err);
    return [];
  }
}
