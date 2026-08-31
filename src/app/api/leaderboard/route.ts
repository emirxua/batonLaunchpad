import { NextResponse } from "next/server";
import { TRACKED_COINS } from "@/lib/tracked-coins";
import { getBurnLevel } from "@/lib/burn-levels";
import { Coin } from "@/types/coin";

import { getAllBurns, getBurnTotalsByCoin } from "@/lib/turso-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEX = "https://api.dexscreener.com";
const FETCH_MS = 6000;

async function fetchJson<T>(url: string, ms = FETCH_MS): Promise<T | null> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

interface DexPair {
  chainId?: string;
  pairAddress?: string;
  baseToken?: { address: string; name: string; symbol: string };
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  info?: { imageUrl?: string };
}

export async function GET() {
  const burnsMap: Record<string, { amount: number; coinName?: string; coinTicker?: string; userAddress?: string }> = {};
  let totalBurnedAllCoins = 0;

  try {
    const [totalsByCoin, recentBurns] = await Promise.all([
      getBurnTotalsByCoin(),
      getAllBurns(),
    ]);

    for (const [coinId, total] of Object.entries(totalsByCoin)) {
      const key = coinId.toLowerCase();
      const match = recentBurns.find((b) => b.coinId.toLowerCase() === key);
      burnsMap[key] = {
        amount: Number(total) || 0,
        coinName: match?.coinName || "Solana Project",
        coinTicker: match?.coinTicker || "TOKEN",
        userAddress: match?.userAddress,
      };
      totalBurnedAllCoins += Number(total) || 0;
    }

    // Fallback: If any burn wasn't grouped
    for (const b of recentBurns) {
      const key = b.coinId?.toLowerCase();
      if (key && !burnsMap[key]) {
        burnsMap[key] = {
          amount: b.amount || 0,
          coinName: b.coinName,
          coinTicker: b.coinTicker,
          userAddress: b.userAddress,
        };
        totalBurnedAllCoins += b.amount || 0;
      }
    }
  } catch (err) {
    console.warn("Leaderboard burns load notice:", err);
  }

  const boostedMints = Object.keys(burnsMap).filter((k) => burnsMap[k].amount > 0);

  if (boostedMints.length === 0) {
    return NextResponse.json(
      {
        success: true,
        updatedAt: Date.now(),
        count: 0,
        coins: [],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  }

  // Fetch DexScreener info for boosted mints
  const pairMap = new Map<string, DexPair>();
  try {
    const data = await fetchJson<{ pairs?: DexPair[] }>(
      `${DEX}/latest/dex/tokens/${boostedMints.join(",")}`
    );
    for (const pair of data?.pairs ?? []) {
      if (pair.chainId !== "solana" || !pair.baseToken?.address) continue;
      const addr = pair.baseToken.address.toLowerCase();
      const existing = pairMap.get(addr);
      if (!existing || (pair.liquidity?.usd ?? 0) > (existing.liquidity?.usd ?? 0)) {
        pairMap.set(addr, pair);
      }
    }
  } catch {
    /* not fatal */
  }

  const coins: Coin[] = [];

  for (const mintKey of boostedMints) {
    const burnInfo = burnsMap[mintKey];
    const pair = pairMap.get(mintKey);

    const priceUsd = pair?.priceUsd ? parseFloat(pair.priceUsd) : 0;
    const marketCap = pair?.marketCap ?? pair?.fdv ?? 0;
    const volume24h = pair?.volume?.h24 ?? 0;
    const change24h = pair?.priceChange?.h24 ?? 0;
    const imageUrl = pair?.info?.imageUrl ?? undefined;
    const symbol = (pair?.baseToken?.symbol || burnInfo.coinTicker || "TOKEN").toUpperCase();
    const name = pair?.baseToken?.name || burnInfo.coinName || "Solana Project";

    coins.push({
      id: `boosted-${mintKey.slice(0, 8)}`,
      name,
      ticker: symbol,
      mintAddress: pair?.baseToken?.address || mintKey,
      imageUrl,
      iconColor: "#f59e0b",
      category: "Ranked",
      description: `Boosted by community with ${burnInfo.amount.toLocaleString()} $BATON burned.`,
      priceUsd,
      marketCap,
      volume24h,
      change24h,
      sparkline: [],
      totalBurnedBaton: burnInfo.amount,
      burnLevel: getBurnLevel(burnInfo.amount),
      pairAddress: pair?.pairAddress,
      liquidityUsd: pair?.liquidity?.usd ?? 0,
      viewsCount: 0,
    });
  }

  // Sort strictly by totalBurnedBaton descending
  coins.sort((a, b) => (b.totalBurnedBaton || 0) - (a.totalBurnedBaton || 0));

  return NextResponse.json({
    success: true,
    updatedAt: Date.now(),
    count: coins.length,
    totalBurned: totalBurnedAllCoins,
    coins,
  });
}
