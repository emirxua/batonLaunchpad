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
 * 3. Filters: chainId === 'solana', marketCap >= 50,000 USD, liquidity.usd > 1,000 USD
 * 4. Sorts: 24h Volume (h24) DESC
 * 5. Returns formatted DexTrendingToken[] with zero mock data.
 */
export async function fetchDexTrendingTokens(
  minMarketCap: number = 50_000,
  minLiquidity: number = 1_000
): Promise<DexTrendingToken[]> {
  try {
    // 1. Fetch top boosted tokens from DexScreener
    const boostRes = await fetch(
      "https://api.dexscreener.com/token-boosts/top/v1",
      {
        headers: {
          Accept: "application/json",
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

    // Extract unique Solana mint addresses
    const solanaMints = Array.from(
      new Set(
        boostData
          .filter((t) => t.chainId?.toLowerCase() === "solana" && t.tokenAddress)
          .map((t) => t.tokenAddress!)
      )
    ).slice(0, 30);

    if (solanaMints.length === 0) {
      return [];
    }

    // 2. Fetch full DEX pair details for these tokens in batch
    const pairsRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${solanaMints.join(",")}`,
      {
        headers: {
          Accept: "application/json",
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

      // Filter requirements: mcap >= $50k, liquidity > $1k
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

    // 4. Sort by 24h Volume DESC
    const trendingList = Array.from(tokenMap.values()).sort(
      (a, b) => b.volume24h - a.volume24h
    );

    return trendingList;
  } catch (err) {
    console.warn("fetchDexTrendingTokens network error:", err);
    return [];
  }
}
