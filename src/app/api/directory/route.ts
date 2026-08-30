import { NextResponse } from "next/server";
import { TRACKED_COINS } from "@/lib/tracked-coins";
import { getCoinsMarketData } from "@/lib/dexscreener";
import { getWatchlistMap, DEFAULT_WATCHLIST } from "@/lib/callouts/watchlist";
import { CalloutCard } from "@/lib/types/callouts";

export const dynamic = "force-dynamic";
export const revalidate = 15;

const rawRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
const rpcUrl =
  rawRpc && (rawRpc.startsWith("http://") || rawRpc.startsWith("https://"))
    ? rawRpc
    : "https://rpc.ankr.com/solana";

const rawMint = process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS?.trim();
const BATON_MINT = rawMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

let cachedDirectory: Record<string, unknown> | null = null;
let lastFetchTime = 0;

export async function GET() {
  const now = Date.now();

  // 15s in-memory cache to prevent upstream rate limiting
  if (cachedDirectory && now - lastFetchTime < 15_000) {
    return NextResponse.json(cachedDirectory, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  }

  try {
    const mintAddresses = TRACKED_COINS.map((c) => c.mintAddress);

    // 1. Fetch live enriched coin market data in parallel with callouts
    const [coins, recentCallouts] = await Promise.all([
      getCoinsMarketData(mintAddresses),
      (async (): Promise<CalloutCard[]> => {
        try {
          const proxyUrl =
            process.env.CALLOUT_PROXY_BASE ||
            process.env.NEXT_PUBLIC_CALLOUT_PROXY_URL ||
            "https://pump-callout-proxy.emir1903topuz106.workers.dev/";

          const ctrl = new AbortController();
          const id = setTimeout(() => ctrl.abort(), 3500);

          const calloutRes = await fetch(proxyUrl, {
            signal: ctrl.signal,
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
          clearTimeout(id);

          if (calloutRes.ok) {
            const cData = await calloutRes.json();
            const labelMap = getWatchlistMap();
            const rawResults = Array.isArray(cData.results) ? cData.results : [];
            const list: CalloutCard[] = [];

            for (const item of rawResults) {
              const wallet = item.wallet;
              const label =
                labelMap[wallet] ??
                DEFAULT_WATCHLIST[wallet] ??
                `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

              const isOk = item.ok !== false && (!item.status || item.status === 200);
              if (!isOk) continue;

              const calloutsList = Array.isArray(item.callouts) ? item.callouts : [];
              for (const c of calloutsList) {
                list.push({
                  ...c,
                  callerWallet: wallet,
                  callerLabel: label,
                });
              }
            }

            list.sort((a, b) => b.createdAt - a.createdAt);
            return list.slice(0, 8);
          }
        } catch {
          // Keep empty if proxy fails, non-blocking
        }
        return [];
      })(),
    ]);

    // 2. Sort coins by totalBurnedBaton descending
    const rankedCoins = [...coins].sort(
      (a, b) => (b.totalBurnedBaton || 0) - (a.totalBurnedBaton || 0)
    );

    const top1Coin = rankedCoins[0] || null;
    const activeRooms = coins.filter((c) => (c.volume24h || 0) > 0).length;
    const totalVolume24h = coins.reduce((sum, c) => sum + (c.volume24h || 0), 0);
    const totalBurned = coins.reduce((acc, c) => acc + (c.totalBurnedBaton || 0), 0);

    const payload = {
      success: true,
      timestamp: now,
      totalBurned,
      coins: rankedCoins,
      top1Coin,
      recentCallouts,
      marketOverview: {
        activeRooms,
        totalVolume24h,
        attentionLeaderTicker: top1Coin?.ticker || "BATON",
        attentionLeaderMcap: top1Coin?.marketCap || 0,
      },
    };

    cachedDirectory = payload;
    lastFetchTime = now;

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("API /api/directory error:", error);

    const errorPayload = {
      success: false,
      timestamp: now,
      totalBurned: 0,
      coins: [],
      top1Coin: null,
      recentCallouts: [],
      marketOverview: {
        activeRooms: 0,
        totalVolume24h: 0,
        attentionLeaderTicker: "BATON",
        attentionLeaderMcap: 0,
      },
    };

    return NextResponse.json(cachedDirectory || errorPayload, { status: 200 });
  }
}
