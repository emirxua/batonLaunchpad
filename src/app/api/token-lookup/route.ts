import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface LookupResult {
  mint: string;
  name: string;
  symbol: string;
  iconUrl: string | null;
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  pairAddress: string | null;
  source: string;
}

const lookupCache = new Map<string, { data: LookupResult; time: number }>();

async function fetchFromPumpFun(mint: string): Promise<LookupResult | null> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(
      `https://frontend-api-v3.pump.fun/coins/${encodeURIComponent(mint)}`,
      {
        headers: { Accept: "application/json" },
        signal: ctrl.signal,
        cache: "no-store",
      }
    );
    clearTimeout(tid);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.name || data.symbol)) {
        const mcap = Number(data.usd_market_cap) || 0;
        const isBaton = mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
        return {
          mint,
          name: data.name || data.symbol || "Baton Corporation Ltd",
          symbol: (data.symbol || "BATON").toUpperCase(),
          iconUrl: isBaton ? "/images/baton-logo.png" : (data.image_uri || null),
          priceUsd: mcap > 0 ? mcap / 1_000_000_000 : 0,
          marketCap: mcap,
          volume24h: 0,
          priceChange24h: 0,
          pairAddress: data.pool_address || null,
          source: "pumpfun",
        };
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

async function fetchFromDexScreener(mint: string): Promise<LookupResult | null> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; BatonTerminal/1.0)",
        },
        signal: ctrl.signal,
        cache: "no-store",
      }
    );
    clearTimeout(tid);

    if (res.ok) {
      const data = await res.json();
      const pairs: any[] = Array.isArray(data.pairs) ? data.pairs : [];
      if (pairs.length > 0) {
        const matchPair =
          pairs.find(
            (p) =>
              p.baseToken?.address?.toLowerCase() === mint.toLowerCase() ||
              p.quoteToken?.address?.toLowerCase() === mint.toLowerCase()
          ) || pairs[0];

        const isBase = matchPair.baseToken?.address?.toLowerCase() === mint.toLowerCase();
        const target = isBase ? matchPair.baseToken : matchPair.quoteToken || matchPair.baseToken;

        return {
          mint,
          name: target?.name || target?.symbol || "Solana Token",
          symbol: (target?.symbol || "TOKEN").toUpperCase(),
          iconUrl: matchPair.info?.imageUrl || null,
          priceUsd: parseFloat(matchPair.priceUsd || "0") || 0,
          marketCap: matchPair.marketCap ?? matchPair.fdv ?? 0,
          volume24h: matchPair.volume?.h24 || 0,
          priceChange24h: matchPair.priceChange?.h24 || 0,
          pairAddress: matchPair.pairAddress || null,
          source: "dexscreener",
        };
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mint = searchParams.get("mint")?.trim();

  if (!mint || mint.length < 32 || mint.length > 44) {
    return NextResponse.json(
      { error: "Valid Solana mint address (32-44 base58 characters) is required" },
      { status: 400 }
    );
  }

  const cached = lookupCache.get(mint.toLowerCase());
  if (cached && Date.now() - cached.time < 60_000) {
    return NextResponse.json(cached.data);
  }

  try {
    // Query both Pump.fun and DexScreener in parallel for maximum speed
    const isPump = mint.toLowerCase().endsWith("pump");

    // If it's a pump token, check pump.fun first (30ms), otherwise DexScreener
    let result: LookupResult | null = null;

    if (isPump) {
      result = await fetchFromPumpFun(mint);
      if (!result) {
        result = await fetchFromDexScreener(mint);
      }
    } else {
      result = await fetchFromDexScreener(mint);
      if (!result) {
        result = await fetchFromPumpFun(mint);
      }
    }

    if (result) {
      lookupCache.set(mint.toLowerCase(), { data: result, time: Date.now() });
      return NextResponse.json(result, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      });
    }

    // Fallback if not indexed anywhere yet
    const fallback: LookupResult = {
      mint,
      name: "Solana Token",
      symbol: `${mint.slice(0, 4)}…${mint.slice(-4)}`,
      iconUrl: null,
      priceUsd: 0,
      marketCap: 0,
      volume24h: 0,
      priceChange24h: 0,
      pairAddress: null,
      source: "fallback",
    };

    return NextResponse.json(fallback);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
