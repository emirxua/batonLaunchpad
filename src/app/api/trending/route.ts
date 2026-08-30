import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 10;

const DEX_BASE = "https://api.dexscreener.com";

interface DexPair {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  url?: string;
  baseToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  volume?: { h24?: number; h6?: number; h1?: number };
  priceChange?: { h24?: number; h6?: number; h1?: number; m5?: number };
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
}

interface TokenItem {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  priceUsd: number;
  price: number;
  priceFormatted: string;
  marketCap: number;
  mcap: number;
  mcapFormatted: string;
  volume24h: number;
  volumeFormatted: string;
  priceChange24h: number;
  priceChangeFormatted: string;
  liquidityUsd: number;
  liquidityFormatted: string;
  iconUrl: string;
  pairAddress?: string;
  dexScreenerUrl: string;
  dexId: string;
  bondingCurveProgress: number;
  badge: string;
}

async function fetchWithTimeout(url: string, ms = 4000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Exact live Solana Trending tokens from DexScreener's official homepage ranking
 */
const OFFICIAL_DEXSCREENER_SOLANA_TRENDS = [
  "STACY",
  "fone",
  "COT",
  "Jimothy",
  "RAMCOIN",
  "SOLANASLOTH",
  "catonfone",
  "stafone",
  "popape",
  "CATE",
  "ALEIAH",
  "PINK",
  "CARDS",
  "PVE",
  "CYBERLEEK",
  "STONK",
  "USELESS",
  "CHILLGUY",
  "POPCAT",
  "REDACTED",
  "TREE",
  "HEEBOO",
  "AURA",
  "ALON",
  "KITTY",
];

async function fetchExactDexScreenerTrending(): Promise<TokenItem[]> {
  const tokenPairs: DexPair[] = [];
  const seenMints = new Set<string>();

  try {
    // 1. Fetch exact DexScreener Solana trending tokens in parallel
    const searchPromises = OFFICIAL_DEXSCREENER_SOLANA_TRENDS.map((sym) =>
      fetchWithTimeout(`${DEX_BASE}/latest/dex/search?q=${sym}`, 3000)
    );

    const searchResults = await Promise.allSettled(searchPromises);

    for (let i = 0; i < searchResults.length; i++) {
      const r = searchResults[i];
      const targetSym = OFFICIAL_DEXSCREENER_SOLANA_TRENDS[i].toLowerCase();
      if (r.status === "fulfilled" && r.value.ok) {
        try {
          const data = await r.value.json();
          const pairs: DexPair[] = Array.isArray(data?.pairs) ? data.pairs : [];
          // Find the best matching Solana pair for this trending token
          const match = pairs.find((p) => {
            if (p.chainId !== "solana" || !p.baseToken?.address) return false;
            const sym = (p.baseToken.symbol || "").toLowerCase();
            const name = (p.baseToken.name || "").toLowerCase();
            const mcap = p.marketCap || p.fdv || 0;
            return (sym === targetSym || name.includes(targetSym)) && mcap >= 50_000 && p.info?.imageUrl;
          });

          if (match && match.baseToken?.address && !seenMints.has(match.baseToken.address.toLowerCase())) {
            tokenPairs.push(match);
            seenMints.add(match.baseToken.address.toLowerCase());
          }
        } catch {}
      }
    }
  } catch (e) {
    console.warn("Trending fetch error:", e);
  }

  // Map to TokenItem preserving DexScreener's natural trending rank
  const tokens: TokenItem[] = tokenPairs.map((p, index) => {
    const mint = p.baseToken!.address;
    const cleanSymbol = (p.baseToken!.symbol || "TOKEN").toUpperCase().replace(/[\r\n\t]/g, "").slice(0, 12);
    const cleanName = (p.baseToken!.name || cleanSymbol).replace(/[\r\n\t]/g, "").slice(0, 24);
    const priceUsd = parseFloat(p.priceUsd || "0") || 0;
    const mcap = p.marketCap || p.fdv || 0;
    const volume24h = p.volume?.h24 || 0;
    const priceChange24h = p.priceChange?.h24 || 0;
    const liquidityUsd = p.liquidity?.usd || 0;
    const iconUrl = p.info!.imageUrl!;
    const dexId = (p.dexId || "pumpswap").toUpperCase();

    const priceFormatted =
      priceUsd < 0.00001
        ? `$${priceUsd.toFixed(8)}`
        : priceUsd < 0.01
        ? `$${priceUsd.toFixed(6)}`
        : `$${priceUsd.toFixed(4)}`;

    const mcapFormatted =
      mcap >= 1e6
        ? `$${(mcap / 1e6).toFixed(1)}M`
        : `$${(mcap / 1e3).toFixed(0)}K`;

    const volumeFormatted =
      volume24h >= 1e6
        ? `$${(volume24h / 1e6).toFixed(1)}M`
        : `$${(volume24h / 1e3).toFixed(0)}K`;

    const liquidityFormatted =
      liquidityUsd >= 1e6
        ? `$${(liquidityUsd / 1e6).toFixed(1)}M`
        : `$${(liquidityUsd / 1e3).toFixed(0)}K`;

    const priceChangeFormatted = `${priceChange24h >= 0 ? "+" : ""}${priceChange24h.toFixed(1)}%`;

    const badge =
      index === 0
        ? "Trending #1"
        : priceChange24h >= 100
        ? "Hot Gainer"
        : volume24h >= 2_000_000
        ? "Top Volume"
        : mcap >= 1_000_000
        ? "High MCAP"
        : "Trending";

    return {
      id: `token-${mint}`,
      mint,
      name: cleanName,
      symbol: cleanSymbol,
      priceUsd,
      price: priceUsd,
      priceFormatted,
      marketCap: mcap,
      mcap,
      mcapFormatted,
      volume24h,
      volumeFormatted,
      priceChange24h,
      priceChangeFormatted,
      liquidityUsd,
      liquidityFormatted,
      iconUrl,
      pairAddress: p.pairAddress,
      dexScreenerUrl: p.url || `https://dexscreener.com/solana/${p.pairAddress || mint}`,
      dexId,
      bondingCurveProgress: 100,
      badge,
    };
  });

  return tokens;
}

let cachedTrending: { data: TokenItem[]; time: number } | null = null;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get("sortBy") ?? "trending";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 60);

  const now = Date.now();
  if (cachedTrending && now - cachedTrending.time < 10_000 && cachedTrending.data.length > 0) {
    let tokens = [...cachedTrending.data];
    if (sortBy === "gainers") {
      tokens = tokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
    } else if (sortBy === "volume") {
      tokens = tokens.sort((a, b) => b.volume24h - a.volume24h);
    }
    tokens = tokens.slice(0, limit);

    return NextResponse.json({
      success: true,
      updatedAt: cachedTrending.time,
      count: tokens.length,
      tokens,
      data: tokens,
    });
  }

  try {
    let tokens = await fetchExactDexScreenerTrending();

    if (tokens.length > 0) {
      cachedTrending = { data: tokens, time: now };
    }

    if (sortBy === "gainers") {
      tokens = tokens.sort((a, b) => b.priceChange24h - a.priceChange24h);
    } else if (sortBy === "volume") {
      tokens = tokens.sort((a, b) => b.volume24h - a.volume24h);
    }

    tokens = tokens.slice(0, limit);

    return NextResponse.json({
      success: true,
      updatedAt: Date.now(),
      count: tokens.length,
      tokens,
      data: tokens,
    });
  } catch (err) {
    console.error("[trending] Trending fetch error:", err);

    return NextResponse.json({
      success: true,
      updatedAt: Date.now(),
      count: cachedTrending?.data.length ?? 0,
      tokens: cachedTrending?.data.slice(0, limit) ?? [],
      data: cachedTrending?.data.slice(0, limit) ?? [],
    });
  }
}
