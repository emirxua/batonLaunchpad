import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface CalloutItem {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  description: string;
  imageUri: string;
  creator: string;
  createdTimestamp: number;
  lastReply: number;
  replyCount: number;
  marketCapUsd: number;
  priceUsd: string;
  volume24h: number;
  priceChange24h: number;
  pumpFunUrl: string;
  dexScreenerUrl: string;
  source: "pump.fun" | "dexscreener" | "fallback";
}

export interface CalloutsResponse {
  success: boolean;
  count: number;
  data: CalloutItem[];
  cached: boolean;
  timestamp: number;
}

// In-Memory Cache Store (30 seconds TTL)
let cachedCallouts: CalloutItem[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 30_000;

// High-reliability static fallback tokens
const FALLBACK_TOKENS: CalloutItem[] = [
  {
    id: "baton-primary",
    mint: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
    name: "Baton",
    symbol: "BATON",
    description: "The premier mascot token and deflationary burn engine on Solana.",
    imageUri: "https://cdn.dexscreener.com/cms/images/B_1EShunz2lCb0jz?width=800&height=800&quality=95&format=auto",
    creator: "7WKnG...4vQ8",
    createdTimestamp: Date.now() - 3600000,
    lastReply: Date.now(),
    replyCount: 1420,
    marketCapUsd: 12500,
    priceUsd: "0.0000125",
    volume24h: 890,
    priceChange24h: 18.2,
    pumpFunUrl: "https://pump.fun/coin/2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
    dexScreenerUrl: "https://dexscreener.com/solana/2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
    source: "fallback",
  },
];

interface PumpFunCoin {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image_uri?: string;
  creator?: string;
  created_timestamp?: number;
  last_reply?: number;
  reply_count?: number;
  usd_market_cap?: number;
  market_cap?: number;
}

interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd?: string;
  priceChange?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  volume?: {
    h24?: number;
  };
  marketCap?: number;
  fdv?: number;
  info?: {
    imageUrl?: string;
    header?: string;
  };
}

export async function GET() {
  const now = Date.now();

  // 1. Return in-memory cache if fresh
  if (cachedCallouts && now - lastCacheTime < CACHE_TTL_MS) {
    return NextResponse.json(
      {
        success: true,
        count: cachedCallouts.length,
        data: cachedCallouts,
        cached: true,
        timestamp: lastCacheTime,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  }

  let enrichedItems: CalloutItem[] = [];

  try {
    // 2. Fetch active reply/callout tokens from Pump.fun public endpoints
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let pumpCoins: PumpFunCoin[] = [];
    try {
      const pumpRes = await fetch(
        "https://frontend-api.pump.fun/coins?offset=0&limit=30&sort=last_reply&order=DESC&includeNsfw=false",
        {
          signal: controller.signal,
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; BatonOutbidBot/1.0)",
          },
          next: { revalidate: 30 },
        }
      );

      if (pumpRes.ok) {
        pumpCoins = await pumpRes.json();
      }
    } catch (pumpErr) {
      console.warn("Pump.fun API error or timeout, falling back to DexScreener trending:", pumpErr);
    } finally {
      clearTimeout(timeoutId);
    }

    // 3. Extract mint addresses and enrich with DexScreener
    if (Array.isArray(pumpCoins) && pumpCoins.length > 0) {
      const mints = Array.from(new Set(pumpCoins.map((c) => c.mint).filter(Boolean))).slice(0, 30);

      const dexController = new AbortController();
      const dexTimeout = setTimeout(() => dexController.abort(), 4000);

      let dexPairsMap = new Map<string, DexPair>();

      try {
        const dexRes = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${mints.join(",")}`,
          {
            signal: dexController.signal,
            headers: { "Accept": "application/json" },
            next: { revalidate: 30 },
          }
        );

        if (dexRes.ok) {
          const dexData = await dexRes.json();
          if (Array.isArray(dexData.pairs)) {
            for (const pair of dexData.pairs) {
              const baseAddr = pair.baseToken?.address;
              if (baseAddr && !dexPairsMap.has(baseAddr)) {
                dexPairsMap.set(baseAddr, pair);
              }
            }
          }
        }
      } catch (dexErr) {
        console.warn("DexScreener enrichment error:", dexErr);
      } finally {
        clearTimeout(dexTimeout);
      }

      // Merge Pump.fun + DexScreener market data
      enrichedItems = pumpCoins.map((coin) => {
        const dex = dexPairsMap.get(coin.mint);

        const marketCap =
          dex?.marketCap ||
          dex?.fdv ||
          coin.usd_market_cap ||
          (coin.market_cap ? coin.market_cap * 0.000000001 : 0);

        const priceUsd = dex?.priceUsd || "0.000001";
        const volume24h = dex?.volume?.h24 || 0;
        const priceChange24h = dex?.priceChange?.h24 || 0;
        const image = dex?.info?.imageUrl || coin.image_uri || "";

        return {
          id: `pump-${coin.mint}`,
          mint: coin.mint,
          name: coin.name || "Unknown Token",
          symbol: (coin.symbol || "TOKEN").toUpperCase(),
          description: coin.description || "Active community coin on pump.fun",
          imageUri: image,
          creator: coin.creator || "",
          createdTimestamp: coin.created_timestamp || Date.now() - 3600000,
          lastReply: coin.last_reply || Date.now(),
          replyCount: coin.reply_count || 0,
          marketCapUsd: Math.round(marketCap),
          priceUsd,
          volume24h: Math.round(volume24h),
          priceChange24h: Number(priceChange24h.toFixed(2)),
          pumpFunUrl: `https://pump.fun/coin/${coin.mint}`,
          dexScreenerUrl: dex?.url || `https://dexscreener.com/solana/${coin.mint}`,
          source: "pump.fun",
        };
      });
    }

    // 4. If pump.fun returned no tokens, fallback to DexScreener Solana Trending Pairs
    if (enrichedItems.length === 0) {
      try {
        const fallbackRes = await fetch(
          "https://api.dexscreener.com/latest/dex/search?q=pump",
          {
            headers: { "Accept": "application/json" },
            next: { revalidate: 30 },
          }
        );

        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData.pairs)) {
            enrichedItems = fallbackData.pairs
              .filter((p: DexPair) => p.chainId === "solana")
              .slice(0, 20)
              .map((p: DexPair) => ({
                id: `dex-${p.baseToken.address}`,
                mint: p.baseToken.address,
                name: p.baseToken.name || "Solana Token",
                symbol: (p.baseToken.symbol || "SOL").toUpperCase(),
                description: "Trending Solana community asset indexed on DexScreener.",
                imageUri: p.info?.imageUrl || "",
                creator: "",
                createdTimestamp: Date.now() - 7200000,
                lastReply: Date.now(),
                replyCount: 100,
                marketCapUsd: Math.round(p.marketCap || p.fdv || 0),
                priceUsd: p.priceUsd || "0.000001",
                volume24h: Math.round(p.volume?.h24 || 0),
                priceChange24h: Number((p.priceChange?.h24 || 0).toFixed(2)),
                pumpFunUrl: `https://pump.fun/coin/${p.baseToken.address}`,
                dexScreenerUrl: p.url,
                source: "dexscreener",
              }));
          }
        }
      } catch (fbErr) {
        console.warn("DexScreener search fallback error:", fbErr);
      }
    }

    // 5. Ultimate fallback if all external calls fail
    if (enrichedItems.length === 0) {
      enrichedItems = FALLBACK_TOKENS;
    }

    // Update in-memory cache
    cachedCallouts = enrichedItems;
    lastCacheTime = now;

    return NextResponse.json(
      {
        success: true,
        count: enrichedItems.length,
        data: enrichedItems,
        cached: false,
        timestamp: now,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Critical error in /api/callouts route:", error);

    // If cache exists, return it
    if (cachedCallouts && cachedCallouts.length > 0) {
      return NextResponse.json(
        {
          success: true,
          count: cachedCallouts.length,
          data: cachedCallouts,
          cached: true,
          timestamp: lastCacheTime,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    }

    // Fallback response with static verified token
    return NextResponse.json(
      {
        success: true,
        count: FALLBACK_TOKENS.length,
        data: FALLBACK_TOKENS,
        cached: false,
        timestamp: now,
      },
      { status: 200 }
    );
  }
}
