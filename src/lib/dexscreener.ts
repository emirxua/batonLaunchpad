import { Coin } from "@/types/coin";
import { TRACKED_COINS, getFallbackCoins } from "./tracked-coins";
import { getBurnLevel } from "./burn-levels";

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  volume: {
    h24: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  priceChange: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  info?: {
    imageUrl?: string;
    header?: string;
    openGraph?: string;
    websites?: Array<{ url: string; label: string }>;
    socials?: Array<{ url: string; type: string }>;
  };
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

/**
 * Fetches market data from DexScreener API for a list of Solana token mint addresses
 * and normalizes the results into the Coin format.
 */
export async function getCoinsMarketData(
  mintAddresses: string[]
): Promise<Coin[]> {
  const fallbackList = getFallbackCoins();

  if (!mintAddresses || mintAddresses.length === 0) {
    return fallbackList;
  }

  try {
    const joinedMints = mintAddresses.join(",");
    const url = `https://api.dexscreener.com/latest/dex/tokens/${joinedMints}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 30 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `DexScreener API responded with status ${response.status}. Using fallback data.`
      );
      return fallbackList;
    }

    const data: DexScreenerResponse = await response.json();
    const pairs = data.pairs || [];

    // Map best pair per mint address (preferring highest 24h volume or liquidity)
    const pairsMap = new Map<string, DexScreenerPair>();

    for (const pair of pairs) {
      if (pair.chainId !== "solana") continue;

      const mint = pair.baseToken.address;
      const existing = pairsMap.get(mint);

      if (!existing || (pair.volume?.h24 || 0) > (existing.volume?.h24 || 0)) {
        pairsMap.set(mint, pair);
      }
    }

    // Merge DexScreener data with tracked coin configuration
    const enrichedCoins: Coin[] = TRACKED_COINS.map((config) => {
      const pair = pairsMap.get(config.mintAddress);

      if (!pair) {
        // Return fallback if DexScreener has no active pair yet for this mint
        return {
          id: config.id,
          name: config.name,
          ticker: config.ticker,
          mintAddress: config.mintAddress,
          iconColor: config.iconColor,
          priceUsd: config.fallbackPriceUsd,
          marketCap: config.fallbackMarketCap,
          volume24h: config.fallbackVolume24h,
          change24h: config.fallbackChange24h,
          sparkline: config.sparkline,
          totalBurnedBaton: config.totalBurnedBaton,
          burnLevel: getBurnLevel(config.totalBurnedBaton),
        };
      }

      const marketCap =
        pair.marketCap ||
        pair.fdv ||
        config.fallbackMarketCap;

      const volume24h =
        pair.volume?.h24 !== undefined
          ? pair.volume.h24
          : config.fallbackVolume24h;

      const change24h =
        pair.priceChange?.h24 !== undefined
          ? pair.priceChange.h24
          : config.fallbackChange24h;

      const priceUsd = pair.priceUsd
        ? parseFloat(pair.priceUsd)
        : config.fallbackPriceUsd;

      const imageUrl =
        pair.info?.imageUrl ||
        config.imageUrl ||
        "https://cdn.dexscreener.com/cms/images/B_1EShunz2lCb0jz?width=800&height=800&quality=95&format=auto";

      const headerUrl =
        pair.info?.header ||
        config.headerUrl ||
        "https://cdn.dexscreener.com/cms/images/vVNqFVaQ0jWxKguy?width=1500&height=500&quality=95&format=auto";

      return {
        id: config.id,
        name: pair.baseToken.name || config.name,
        ticker: pair.baseToken.symbol || config.ticker,
        mintAddress: config.mintAddress,
        imageUrl,
        headerUrl,
        iconColor: config.iconColor,
        priceUsd,
        marketCap,
        volume24h,
        change24h,
        sparkline: config.sparkline,
        totalBurnedBaton: config.totalBurnedBaton,
        burnLevel: getBurnLevel(config.totalBurnedBaton),
        pairAddress: pair.pairAddress,
      };
    });

    return enrichedCoins;
  } catch (error) {
    console.error("Error fetching DexScreener market data:", error);
    return fallbackList;
  }
}
