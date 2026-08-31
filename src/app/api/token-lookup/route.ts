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

const lookupCache = new Map<string, { data: LookupResult | LookupResult[]; time: number }>();

const BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

export function normalizeTokenImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("ipfs://")) {
    return `https://pump.mypinata.cloud/ipfs/${trimmed.replace("ipfs://", "")}`;
  }
  if (trimmed.includes("/ipfs/")) {
    const hash = trimmed.split("/ipfs/")[1]?.split("?")[0];
    if (hash) {
      return `https://pump.mypinata.cloud/ipfs/${hash}`;
    }
  }
  return trimmed;
}

async function fetchFromPumpFun(mint: string): Promise<LookupResult | null> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(
      `https://frontend-api-v3.pump.fun/coins/${encodeURIComponent(mint)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        signal: ctrl.signal,
        cache: "no-store",
      }
    );
    clearTimeout(tid);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.name || data.symbol)) {
        const mcap = Number(data.usd_market_cap) || 0;
        const isBaton = mint === BATON_MINT;
        const rawImg = isBaton ? "/images/baton-logo.png" : (data.image_uri || null);
        return {
          mint,
          name: data.name || data.symbol || "Solana Token",
          symbol: (data.symbol || "TOKEN").toUpperCase(),
          iconUrl: normalizeTokenImageUrl(rawImg),
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
    const tid = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
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

        let iconUrl = matchPair.info?.imageUrl
          ? normalizeTokenImageUrl(matchPair.info.imageUrl)
          : mint === BATON_MINT
          ? "/images/baton-logo.png"
          : null;

        // If DexScreener has no image, attempt to fetch real image from pump.fun
        if (!iconUrl && (mint.toLowerCase().endsWith("pump") || isBase)) {
          try {
            const pumpData = await fetchFromPumpFun(mint);
            if (pumpData?.iconUrl) {
              iconUrl = pumpData.iconUrl;
            }
          } catch {
            // ignore
          }
        }

        return {
          mint,
          name: target?.name || target?.symbol || "Solana Token",
          symbol: (target?.symbol || "TOKEN").toUpperCase(),
          iconUrl,
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

// Text Search by Name/Symbol across DexScreener with strict high-quality sorting (Images First -> Highest Vol -> Highest MCAP)
async function searchByNameOrSymbol(query: string): Promise<LookupResult[]> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
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
      const solPairs = pairs.filter((p) => p.chainId === "solana" && p.baseToken?.address);

      // Best pair per unique mint
      const tokenMap = new Map<string, any>();

      for (const p of solPairs) {
        const mint = p.baseToken.address;
        const vol = p.volume?.h24 || 0;
        const liq = p.liquidity?.usd || 0;

        if (tokenMap.has(mint)) {
          const existing = tokenMap.get(mint);
          if (vol <= (existing.volume?.h24 || 0) && liq <= (existing.liquidity?.usd || 0)) {
            continue;
          }
        }
        tokenMap.set(mint, p);
      }

      const deduplicatedPairs = Array.from(tokenMap.values());

      // ── STRICT QUALITY SORT: 1. Has Image -> 2. Volume 24H -> 3. Market Cap ──
      deduplicatedPairs.sort((a, b) => {
        const aHasImg = Boolean(a.info?.imageUrl || a.baseToken.address === BATON_MINT);
        const bHasImg = Boolean(b.info?.imageUrl || b.baseToken.address === BATON_MINT);

        if (aHasImg && !bHasImg) return -1;
        if (!aHasImg && bHasImg) return 1;

        const aVol = a.volume?.h24 || 0;
        const bVol = b.volume?.h24 || 0;
        if (bVol !== aVol) return bVol - aVol;

        const aMcap = a.marketCap ?? a.fdv ?? 0;
        const bMcap = b.marketCap ?? b.fdv ?? 0;
        return bMcap - aMcap;
      });

      const results: LookupResult[] = deduplicatedPairs.slice(0, 16).map((p) => {
        const base = p.baseToken;
        const isBaton = base.address === BATON_MINT;
        const symbol = (base.symbol || "TOKEN").toUpperCase();

        return {
          mint: base.address,
          name: base.name || symbol,
          symbol,
          iconUrl: isBaton
            ? "/images/baton-logo.png"
            : (p.info?.imageUrl || null),
          priceUsd: parseFloat(p.priceUsd || "0") || 0,
          marketCap: p.marketCap ?? p.fdv ?? 0,
          volume24h: p.volume?.h24 || 0,
          priceChange24h: p.priceChange?.h24 || 0,
          pairAddress: p.pairAddress || null,
          source: "dexscreener_search",
        };
      });

      // If searching for "baton", ensure official Baton Corporation is strictly on top
      if (query.toLowerCase().includes("baton")) {
        const batonIndex = results.findIndex((r) => r.mint === BATON_MINT);
        if (batonIndex > 0) {
          const [batonItem] = results.splice(batonIndex, 1);
          results.unshift(batonItem);
        } else if (batonIndex === -1) {
          results.unshift({
            mint: BATON_MINT,
            name: "Baton Corporation Ltd",
            symbol: "BATON",
            iconUrl: "/images/baton-logo.png",
            priceUsd: 0.0000098,
            marketCap: 2600000,
            volume24h: 185000,
            priceChange24h: 12.5,
            pairAddress: null,
            source: "baton_core",
          });
        }
      }

      return results;
    }
  } catch {}
  return [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mintParam = searchParams.get("mint")?.trim();
  const queryParam = (searchParams.get("q") || searchParams.get("query") || mintParam || "").trim();

  if (!queryParam) {
    return NextResponse.json(
      { error: "Query parameter 'q' or 'mint' is required" },
      { status: 400 }
    );
  }

  // 1. Text Search (Name or Symbol)
  const isAddress = queryParam.length >= 32 && queryParam.length <= 44 && !queryParam.includes(" ");

  if (!isAddress) {
    const cached = lookupCache.get(`search:${queryParam.toLowerCase()}`);
    if (cached && Date.now() - cached.time < 30_000) {
      return NextResponse.json({
        success: true,
        query: queryParam,
        results: cached.data,
      });
    }

    const searchResults = await searchByNameOrSymbol(queryParam);
    lookupCache.set(`search:${queryParam.toLowerCase()}`, { data: searchResults, time: Date.now() });

    return NextResponse.json({
      success: true,
      query: queryParam,
      results: searchResults,
      ...(searchResults[0] || {}),
    });
  }

  // 2. Direct Mint Lookup
  const mint = queryParam;
  const cached = lookupCache.get(mint.toLowerCase());
  if (cached && Date.now() - cached.time < 60_000 && !Array.isArray(cached.data)) {
    return NextResponse.json(cached.data);
  }

  try {
    const isPump = mint.toLowerCase().endsWith("pump");
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
      return NextResponse.json(result);
    }

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
