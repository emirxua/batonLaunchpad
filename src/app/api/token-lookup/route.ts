import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DexPair {
  chainId?: string;
  pairAddress?: string;
  baseToken?: {
    address?: string;
    name?: string;
    symbol?: string;
  };
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  volume?: {
    h24?: number;
  };
  priceChange?: {
    h24?: number;
  };
  liquidity?: {
    usd?: number;
  };
  info?: {
    imageUrl?: string;
  };
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

  try {
    // 1. Query DexScreener token pairs
    const dexRes = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );

    if (dexRes.ok) {
      const data = await dexRes.json();
      const pairs: DexPair[] = Array.isArray(data.pairs) ? data.pairs : [];

      // Filter for Solana chain pairs
      const solanaPairs = pairs.filter(
        (p) => p.chainId?.toLowerCase() === "solana" && p.baseToken?.address
      );

      if (solanaPairs.length > 0) {
        // Pick the pair with highest USD liquidity
        solanaPairs.sort(
          (a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        );

        const best = solanaPairs[0];
        const base = best.baseToken!;

        return NextResponse.json(
          {
            mint: base.address || mint,
            name: base.name || base.symbol || mint.slice(0, 8),
            symbol: (base.symbol || "TOKEN").toUpperCase(),
            iconUrl: best.info?.imageUrl || null,
            priceUsd: parseFloat(best.priceUsd || "0") || 0,
            marketCap: best.marketCap ?? best.fdv ?? 0,
            volume24h: best.volume?.h24 || 0,
            priceChange24h: best.priceChange?.h24 || 0,
            pairAddress: best.pairAddress || null,
            source: "dexscreener",
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
            },
          }
        );
      }
    }

    // 2. Fallback to Pump.fun API if token is in bonding curve without DexScreener pair yet
    try {
      const pumpRes = await fetch(
        `https://frontend-api-v3.pump.fun/coins/${encodeURIComponent(mint)}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );

      if (pumpRes.ok) {
        const pumpData = await pumpRes.json();
        if (pumpData?.symbol) {
          return NextResponse.json(
            {
              mint,
              name: pumpData.name || pumpData.symbol,
              symbol: String(pumpData.symbol).toUpperCase(),
              iconUrl: pumpData.image_uri || null,
              priceUsd: Number(pumpData.usd_market_cap) ? pumpData.usd_market_cap / 1_000_000_000 : 0,
              marketCap: Number(pumpData.usd_market_cap) || 0,
              volume24h: 0,
              priceChange24h: 0,
              pairAddress: null,
              source: "pumpfun",
            },
            {
              status: 200,
              headers: {
                "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
              },
            }
          );
        }
      }
    } catch {
      // ignore pump fallback error
    }

    // 3. If token not found in any Solana indexer, return 404 (NEVER return mock data)
    return NextResponse.json(
      {
        error: `Token with mint ${mint} not found on Solana DEX or bonding curves`,
      },
      { status: 404 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json(
      {
        error: msg,
      },
      { status: 500 }
    );
  }
}
