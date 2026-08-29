import { DexTrendingToken } from "@/lib/types/terminal";

interface DexBoostItem {
  url?: string;
  chainId?: string;
  tokenAddress?: string;
  amount?: number;
  totalAmount?: number;
  icon?: string;
  header?: string;
  description?: string;
}

interface DexPairResponse {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress: string;
  baseToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative?: string;
  priceUsd?: string;
  volume?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  priceChange?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
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
  };
}

interface DexTokenPairsResponse {
  schemaVersion?: string;
  pairs?: DexPairResponse[];
}

/**
 * Fetches trending and boosted Solana tokens from DexScreener Public API.
 * 1. Queries token-boosts/top/v1 for active boosted Solana tokens
 * 2. Fetches detailed DEX pair data in batch
 * 3. Filters: chainId === 'solana', marketCap >= 70,000 USD, liquidity.usd >= 5,000 USD
 * 4. Sorts according to requested sortBy mode (trending/boost order, gainers, or volume)
 * 5. Returns formatted DexTrendingToken[] with zero mock data.
 */
export async function fetchDexTrendingTokens(
  minMarketCap: number = 70_000,
  minLiquidity: number = 5_000,
  sortBy: string = "trending"
): Promise<DexTrendingToken[]> {
  try {
    // 1. Fetch top boosted tokens from DexScreener
    const boostRes = await fetch(
      "https://api.dexscreener.com/token-boosts/top/v1",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
        next: { revalidate: 60 },
      }
    );

    if (!boostRes.ok) {
      console.warn(`DexScreener token-boosts returned status: ${boostRes.status}`);
      return [];
    }

    const boostData = (await boostRes.json()) as DexBoostItem[];
    if (!Array.isArray(boostData)) {
      return [];
    }

    // Extract unique Solana mint addresses preserving boost rank order
    const solanaMints: string[] = [];
    for (const t of boostData) {
      if (t.chainId?.toLowerCase() === "solana" && t.tokenAddress) {
        if (!solanaMints.includes(t.tokenAddress)) {
          solanaMints.push(t.tokenAddress);
        }
      }
    }

    const limitedMints = solanaMints.slice(0, 30);
    if (limitedMints.length === 0) {
      return [];
    }

    // 2. Fetch full DEX pair details for these tokens in batch
    const pairsRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${limitedMints.join(",")}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
        next: { revalidate: 60 },
      }
    );

    if (!pairsRes.ok) {
      console.warn(`DexScreener token pairs returned status: ${pairsRes.status}`);
      return [];
    }

    const pairsData = (await pairsRes.json()) as DexTokenPairsResponse;
    const rawPairs = Array.isArray(pairsData.pairs) ? pairsData.pairs : [];

    // 3. Filter & Deduplicate by baseToken mint (keep the pair with highest liquidity)
    const tokenMap = new Map<string, DexTrendingToken>();

    for (const pair of rawPairs) {
      if (pair.chainId?.toLowerCase() !== "solana") continue;
      if (!pair.baseToken?.address) continue;

      const mcap = pair.marketCap ?? pair.fdv ?? 0;
      const liquidityUsd = pair.liquidity?.usd ?? 0;
      const volume24h = pair.volume?.h24 ?? 0;
      const priceUsd = parseFloat(pair.priceUsd ?? "0") || 0;
      const priceChange24h = pair.priceChange?.h24 ?? 0;

      // Filter requirements: mcap >= $70k, liquidity >= $5k
      if (mcap < minMarketCap) continue;
      if (liquidityUsd < minLiquidity) continue;

      const mint = pair.baseToken.address;
      const existing = tokenMap.get(mint);

      const tokenObj: DexTrendingToken = {
        mint,
        name: pair.baseToken.name || pair.baseToken.symbol || mint.slice(0, 8),
        symbol: pair.baseToken.symbol || "TOKEN",
        priceUsd,
        marketCap: mcap,
        volume24h,
        priceChange24h,
        liquidityUsd,
        pairAddress: pair.pairAddress,
        iconUrl: pair.info?.imageUrl || null,
      };

      if (!existing || tokenObj.liquidityUsd > existing.liquidityUsd) {
        tokenMap.set(mint, tokenObj);
      }
    }

    // 4. Sort according to requested parameter
    let trendingList: DexTrendingToken[] = [];

    if (sortBy === "gainers") {
      trendingList = Array.from(tokenMap.values()).sort(
        (a, b) => b.priceChange24h - a.priceChange24h
      );
    } else if (sortBy === "volume") {
      trendingList = Array.from(tokenMap.values()).sort(
        (a, b) => b.volume24h - a.volume24h
      );
    } else {
      // Preserve DexScreener Boost order
      for (const mint of limitedMints) {
        const token = tokenMap.get(mint);
        if (token) {
          trendingList.push(token);
        }
      }
    }

    return trendingList;
  } catch (err) {
    console.warn("fetchDexTrendingTokens network error:", err);
    return [];
  }
}
