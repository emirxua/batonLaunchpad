import { Coin } from "@/types/coin";
import { TRACKED_COINS } from "./tracked-coins";
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

const CORE_SOLANA_TOKENS = [
  "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump", // Fartcoin
  "6p6xgHyF7AeQHyieLEHCjvqCmQCXTWhYTrznMgFPpump", // TRUMP
  "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr", // POPCAT
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", // WIF
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
  "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv", // PENGU
  "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump", // GOAT
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", // RAY
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // JUP
  "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC", // ai16z
  "KENJSUYLASHUMfHyy5o4Hp2FdNqZg1AsUPhfH2kYpump", // GRIFFAIN
  "J3NKxxXZcnNiMjKw9hYb2K4LUxgwCPDCQ1WSwYpCpump", // SPX
  "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump", // BATON
];

function classifyCategory(symbol: string, name: string, desc: string): string {
  const txt = `${symbol} ${name} ${desc}`.toLowerCase();
  if (/\bai\b|agent|gpt|neural|llm|openai|claude|gemini/.test(txt)) return "Agents";
  if (/defi|swap|lp|yield|vault|farm|dao|governance|stake/.test(txt)) return "DeFi";
  if (/util|tool|infra|protocol|sdk|bridge|oracle/.test(txt)) return "Utility";
  if (/pepe|doge|shib|frog|cat|dog|meme|wojak|ape|moon|pump/.test(txt)) return "Memes";
  return "Mascots";
}

/**
 * Fetches market data from DexScreener API for token mint addresses
 * and normalizes the results into the Coin format, filtering for real >= $70k tokens.
 */
export async function getCoinsMarketData(
  mintAddresses: string[]
): Promise<Coin[]> {
  try {
    const mintsSet = new Set<string>([...mintAddresses, ...CORE_SOLANA_TOKENS]);

    try {
      const profilesRes = await fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (profilesRes.ok) {
        const profiles = await profilesRes.json();
        if (Array.isArray(profiles)) {
          for (const p of profiles) {
            if (p.chainId === "solana" && p.tokenAddress) {
              mintsSet.add(p.tokenAddress);
            }
          }
        }
      }
    } catch {
      // Continue with available mints
    }

    const allMints = Array.from(mintsSet);
    const BATCH_SIZE = 30;
    const batches: string[][] = [];
    for (let i = 0; i < allMints.length; i += BATCH_SIZE) {
      batches.push(allMints.slice(i, i + BATCH_SIZE));
    }

    const pairsMap = new Map<string, DexScreenerPair>();

    await Promise.all(
      batches.map(async (batch) => {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 4500);
          const response = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${batch.join(",")}`,
            {
              signal: ctrl.signal,
              headers: { Accept: "application/json" },
              cache: "no-store",
            }
          );
          clearTimeout(tid);
          if (!response.ok) return;

          const data: DexScreenerResponse = await response.json();
          for (const pair of data.pairs || []) {
            if (pair.chainId !== "solana" || !pair.baseToken?.address) continue;
            const mint = pair.baseToken.address;
            const existing = pairsMap.get(mint);
            if (!existing || (pair.volume?.h24 || 0) > (existing.volume?.h24 || 0)) {
              pairsMap.set(mint, pair);
            }
          }
        } catch {
          // Skip
        }
      })
    );

    const trackedMap = new Map<string, (typeof TRACKED_COINS)[0]>();
    for (const tc of TRACKED_COINS) {
      trackedMap.set(tc.mintAddress.toLowerCase(), tc);
    }

    const enrichedCoins: Coin[] = [];

    // 1. Tracked coin (BATON)
    for (const config of TRACKED_COINS) {
      const pair = pairsMap.get(config.mintAddress);
      const marketCap = pair?.marketCap || pair?.fdv || 0;
      const volume24h = pair?.volume?.h24 !== undefined ? pair.volume.h24 : 0;
      const change24h = pair?.priceChange?.h24 !== undefined ? pair.priceChange.h24 : 0;
      const priceUsd = pair?.priceUsd ? parseFloat(pair.priceUsd) : 0;

      const imageUrl =
        pair?.info?.imageUrl ||
        config.imageUrl ||
        "https://cdn.dexscreener.com/cms/images/B_1EShunz2lCb0jz?width=800&height=800&quality=95&format=auto";

      const headerUrl =
        pair?.info?.header ||
        config.headerUrl ||
        "https://cdn.dexscreener.com/cms/images/vVNqFVaQ0jWxKguy?width=1500&height=500&quality=95&format=auto";

      const dexScreenerUrl =
        pair?.url ||
        (pair?.pairAddress
          ? `https://dexscreener.com/solana/${pair.pairAddress}`
          : `https://dexscreener.com/solana/${config.mintAddress}`);

      enrichedCoins.push({
        id: config.id,
        name: pair?.baseToken?.name || config.name,
        ticker: pair?.baseToken?.symbol || config.ticker,
        mintAddress: config.mintAddress,
        imageUrl,
        headerUrl,
        iconColor: config.iconColor,
        category: config.category || "Mascots",
        description: config.description || "Official Solana mascot and burn asset.",
        website: config.website,
        twitter: config.twitter,
        viewsCount: config.viewsCount || 0,
        priceUsd,
        marketCap,
        volume24h,
        change24h,
        sparkline: config.sparkline || [],
        totalBurnedBaton: config.totalBurnedBaton || 0,
        burnLevel: getBurnLevel(config.totalBurnedBaton || 0),
        pairAddress: pair?.pairAddress,
        liquidityUsd: pair?.liquidity?.usd || 0,
        dexScreenerUrl,
      });
    }

    // 2. Real trending tokens with MCAP >= 70k
    for (const [mint, pair] of Array.from(pairsMap.entries())) {
      if (trackedMap.has(mint.toLowerCase())) continue;

      const marketCap = pair.marketCap || pair.fdv || 0;
      if (marketCap < 70_000) continue; // Filter out tiny microcaps

      const volume24h = pair.volume?.h24 !== undefined ? pair.volume.h24 : 0;
      const change24h = pair.priceChange?.h24 !== undefined ? pair.priceChange.h24 : 0;
      const priceUsd = pair.priceUsd ? parseFloat(pair.priceUsd) : 0;
      const name = pair.baseToken.name || "Solana Token";
      const symbol = pair.baseToken.symbol || "SOL";

      const website = pair.info?.websites?.[0]?.url;
      const twitter = pair.info?.socials?.find((s) => s.type === "twitter")?.url;

      const dexScreenerUrl =
        pair.url ||
        (pair.pairAddress
          ? `https://dexscreener.com/solana/${pair.pairAddress}`
          : `https://dexscreener.com/solana/${mint}`);

      enrichedCoins.push({
        id: `dex-${mint.slice(0, 8)}`,
        name,
        ticker: symbol,
        mintAddress: mint,
        imageUrl: pair.info?.imageUrl || undefined,
        headerUrl: pair.info?.header || undefined,
        iconColor: "#f97316",
        category: classifyCategory(symbol, name, ""),
        description: "",
        website,
        twitter,
        viewsCount: 0,
        priceUsd,
        marketCap,
        volume24h,
        change24h,
        sparkline: [],
        totalBurnedBaton: 0,
        burnLevel: "none",
        pairAddress: pair.pairAddress,
        liquidityUsd: pair.liquidity?.usd || 0,
        dexScreenerUrl,
      });
    }

    return enrichedCoins.sort((a, b) => b.volume24h - a.volume24h);
  } catch (error) {
    console.error("Error in getCoinsMarketData:", error);
    return [];
  }
}
