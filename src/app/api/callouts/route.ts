import { NextResponse } from "next/server";
import {
  CalloutCard,
  TopCaller,
  CalloutsApiResponse,
  CalloutApiError,
} from "@/lib/types/callouts";
import {
  getWatchlistWallets,
  getWatchlistLabels,
  isWatchlistWallet,
} from "@/lib/callouts/watchlist";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DexTokenPair {
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
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    header?: string;
  };
}

/**
 * Normalizes raw items from pump.fun callout APIs into standard CalloutCard items
 */
function normalizeRawCallout(
  raw: Record<string, unknown>,
  source: string,
  walletLabelMap: Record<string, string>,
  boostedMintsSet: Set<string>
): CalloutCard | null {
  const mint =
    (raw.mint as string) ||
    (raw.tokenMint as string) ||
    (raw.token_mint as string) ||
    (raw.coin_mint as string) ||
    ((raw.token as Record<string, unknown>)?.mint as string) ||
    "";

  if (!mint) return null;

  const caller =
    (raw.caller as string) ||
    (raw.callerAddress as string) ||
    (raw.user as string) ||
    (raw.creator as string) ||
    (raw.wallet as string) ||
    "Unknown Caller";

  const calledAtRaw =
    raw.timestamp ||
    raw.called_at ||
    raw.createdAt ||
    raw.created_timestamp ||
    raw.time;

  let calledAt = Date.now();
  if (typeof calledAtRaw === "number") {
    calledAt = calledAtRaw > 1e11 ? calledAtRaw : calledAtRaw * 1000;
  } else if (typeof calledAtRaw === "string") {
    calledAt = new Date(calledAtRaw).getTime() || Date.now();
  }

  const tokenName =
    (raw.name as string) ||
    (raw.tokenName as string) ||
    ((raw.token as Record<string, unknown>)?.name as string) ||
    "Unknown Token";

  const tokenSymbol = (
    (raw.symbol as string) ||
    (raw.tokenSymbol as string) ||
    ((raw.token as Record<string, unknown>)?.symbol as string) ||
    "TOKEN"
  ).toUpperCase();

  const tokenImageUrl =
    (raw.image_uri as string) ||
    (raw.imageUrl as string) ||
    (raw.image as string) ||
    ((raw.token as Record<string, unknown>)?.image_uri as string) ||
    undefined;

  const mcapAtCall =
    (raw.market_cap_at_call as number) ||
    (raw.mcapAtCall as number) ||
    (raw.initial_market_cap as number) ||
    (raw.usd_market_cap as number) ||
    undefined;

  const callerUsername =
    (raw.callerUsername as string) ||
    (raw.username as string) ||
    walletLabelMap[caller] ||
    undefined;

  const thesis =
    (raw.thesis as string) ||
    (raw.message as string) ||
    (raw.text as string) ||
    (raw.comment as string) ||
    undefined;

  const isBoosted =
    boostedMintsSet.has(mint.toLowerCase()) ||
    mint === "6Hebn672FvMSq61mo4HYq86QgLHgBUm6y8A9bXGppump" ||
    mint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

  return {
    id: `${mint}-${calledAt}-${caller.slice(0, 6)}`,
    mint,
    caller,
    callerUsername,
    callerAvatarUrl: (raw.callerAvatarUrl as string) || (raw.avatar as string) || undefined,
    isWatchlist: isWatchlistWallet(caller),
    watchlistLabel: walletLabelMap[caller] || undefined,
    thesis,
    tokenName,
    tokenSymbol,
    tokenImageUrl,
    calledAt,
    mcapAtCall,
    currentMcap: mcapAtCall || 0,
    currentPriceUsd: "0.00",
    priceChange24h: 0,
    volume24h: 0,
    multiplier: 1.0,
    pumpFunUrl: `https://pump.fun/coin/${mint}`,
    dexScreenerUrl: `https://dexscreener.com/solana/${mint}`,
    isBoosted,
    source,
    rawPumpData: raw,
  };
}

/**
 * Normalizes top callers from pump.fun callout leaderboard APIs
 */
function normalizeTopCaller(
  raw: Record<string, unknown>,
  rank: number,
  walletLabelMap: Record<string, string>
): TopCaller {
  const wallet =
    (raw.wallet as string) ||
    (raw.user as string) ||
    (raw.caller as string) ||
    (raw.address as string) ||
    `caller-${rank}`;

  const username =
    (raw.username as string) ||
    (raw.name as string) ||
    walletLabelMap[wallet] ||
    undefined;

  const totalCalls =
    (raw.totalCalls as number) ||
    (raw.callsCount as number) ||
    (raw.call_count as number) ||
    (raw.calls as number) ||
    0;

  const winRate =
    typeof raw.winRate === "number"
      ? raw.winRate
      : typeof raw.win_rate === "number"
      ? raw.win_rate
      : undefined;

  const avgRoi =
    typeof raw.avgRoi === "number"
      ? raw.avgRoi
      : typeof raw.avg_roi === "number"
      ? raw.avg_roi
      : undefined;

  const score =
    typeof raw.score === "number"
      ? raw.score
      : typeof raw.points === "number"
      ? raw.points
      : undefined;

  let rewardTier: "Diamond" | "Gold" | "Silver" =
    (raw.rewardTier as "Diamond" | "Gold" | "Silver") ||
    (raw.tier as "Diamond" | "Gold" | "Silver") ||
    "Silver";
  if (!raw.rewardTier && !raw.tier) {
    if (rank === 1 || (winRate && winRate >= 75)) {
      rewardTier = "Diamond";
    } else if (rank <= 5 || (winRate && winRate >= 50)) {
      rewardTier = "Gold";
    }
  }

  const recentTokens = Array.isArray(raw.recentTokens)
    ? (raw.recentTokens as string[])
    : Array.isArray(raw.tokens)
    ? (raw.tokens as string[])
    : undefined;

  return {
    rank,
    wallet,
    username,
    avatarUrl: (raw.avatar as string) || (raw.image_uri as string) || undefined,
    totalCalls,
    winRate,
    avgRoi,
    score,
    rewardTier,
    recentTokens,
    rawPumpData: raw,
  };
}

/**
 * Batch DexScreener enrichment for up to 30 mints per chunk
 */
async function enrichWithDexScreener(
  callouts: CalloutCard[]
): Promise<CalloutCard[]> {
  if (callouts.length === 0) return [];

  const uniqueMints = Array.from(new Set(callouts.map((c) => c.mint).filter(Boolean)));
  const pairsMap = new Map<string, DexTokenPair>();

  // Process in chunks of max 30
  const CHUNK_SIZE = 30;
  for (let i = 0; i < uniqueMints.length; i += CHUNK_SIZE) {
    const chunk = uniqueMints.slice(i, i + CHUNK_SIZE);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`,
        {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.pairs)) {
          for (const pair of data.pairs) {
            const baseAddr = pair.baseToken?.address;
            if (baseAddr && !pairsMap.has(baseAddr)) {
              pairsMap.set(baseAddr, pair);
            }
          }
        }
      }
    } catch (dexErr) {
      console.warn("DexScreener enrichment chunk error:", dexErr);
    }
  }

  return callouts.map((card) => {
    const dex = pairsMap.get(card.mint);
    if (!dex) return card;

    const currentMcap = Math.round(dex.marketCap || dex.fdv || card.currentMcap || 0);
    const currentPriceUsd = dex.priceUsd || card.currentPriceUsd;
    const priceChange24h = Number((dex.priceChange?.h24 || 0).toFixed(2));
    const volume24h = Math.round(dex.volume?.h24 || 0);

    let multiplier = 1.0;
    if (card.mcapAtCall && card.mcapAtCall > 0 && currentMcap > 0) {
      multiplier = Number((currentMcap / card.mcapAtCall).toFixed(2));
    }

    const tokenImageUrl = card.tokenImageUrl || dex.info?.imageUrl;

    return {
      ...card,
      currentMcap,
      currentPriceUsd,
      priceChange24h,
      volume24h,
      multiplier,
      tokenImageUrl,
      dexScreenerUrl: dex.url || card.dexScreenerUrl,
    };
  });
}

export async function GET() {
  const errors: CalloutApiError[] = [];
  const rawCallouts: CalloutCard[] = [];
  const topCallers: TopCaller[] = [];
  let successfulSource = "none";

  const jwt = process.env.PUMPFUN_JWT?.trim();
  const cookie = process.env.PUMPFUN_COOKIE?.trim();

  const baseHeaders: Record<string, string> = {
    Accept: "application/json, text/plain, */*",
    Origin: "https://pump.fun",
    Referer: "https://pump.fun/",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  };

  if (jwt) {
    baseHeaders["Authorization"] = jwt.startsWith("Bearer ")
      ? jwt
      : `Bearer ${jwt}`;
  }
  if (cookie) {
    baseHeaders["Cookie"] = cookie;
  }

  const watchWallets = getWatchlistWallets();
  const watchLabels = getWatchlistLabels();

  // Boosted mints list from env
  const boostedMintsSet = new Set<string>();
  if (process.env.BATON_BOOSTED_MINTS) {
    process.env.BATON_BOOSTED_MINTS.split(",").forEach((m) =>
      boostedMintsSet.add(m.trim().toLowerCase())
    );
  }
  if (process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS) {
    boostedMintsSet.add(
      process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS.trim().toLowerCase()
    );
  }

  // -------------------------------------------------------------
  // 1. Fetch Tracked Wallets Callouts (e.g. Alon & alpha callers)
  // -------------------------------------------------------------
  for (const wallet of watchWallets) {
    const listEndpoints = [
      `https://frontend-api-v3.pump.fun/callout/list/${wallet}?sortBy=TIMESTAMP&sortOrder=DESC`,
      `https://advanced-api-v2.pump.fun/callout/list/${wallet}?sortBy=TIMESTAMP&sortOrder=DESC`,
    ];

    let walletFetched = false;
    for (const url of listEndpoints) {
      if (walletFetched) break;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: baseHeaders,
          cache: "no-store",
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json)
            ? json
            : Array.isArray(json?.callouts)
            ? json.callouts
            : Array.isArray(json?.data)
            ? json.data
            : [];

          if (list.length > 0) {
            successfulSource = url.includes("advanced")
              ? "advanced-api-v2.pump.fun"
              : "frontend-api-v3.pump.fun";
            walletFetched = true;

            for (const item of list) {
              const card = normalizeRawCallout(
                item,
                successfulSource,
                watchLabels,
                boostedMintsSet
              );
              if (card) {
                card.caller = wallet;
                card.isWatchlist = true;
                card.watchlistLabel = watchLabels[wallet] || "Watchlist Caller";
                rawCallouts.push(card);
              }
            }
          } else {
            errors.push({
              source: url,
              status: res.status,
              message: `Empty callout list returned for wallet ${wallet}`,
            });
          }
        } else {
          errors.push({
            source: url,
            status: res.status,
            message: `HTTP ${res.status}: ${res.statusText || "Callout list fetch failed"}`,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Request failed";
        errors.push({
          source: url,
          message,
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Fetch Global Live Callouts Feed
  // -------------------------------------------------------------
  const globalEndpoints = [
    "https://frontend-api-v3.pump.fun/callouts",
    "https://advanced-api-v2.pump.fun/callouts",
    "https://frontend-api-v3.pump.fun/callout/top/all?sortBy=TIMESTAMP&sortOrder=DESC",
    "https://advanced-api-v2.pump.fun/callout/top/all?sortBy=TIMESTAMP&sortOrder=DESC",
  ];

  for (const url of globalEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: baseHeaders,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.callouts)
          ? json.callouts
          : Array.isArray(json?.data)
          ? json.data
          : [];

        if (list.length > 0) {
          if (successfulSource === "none") {
            successfulSource = url.includes("advanced")
              ? "advanced-api-v2.pump.fun"
              : "frontend-api-v3.pump.fun";
          }
          for (const item of list) {
            const card = normalizeRawCallout(
              item,
              successfulSource,
              watchLabels,
              boostedMintsSet
            );
            if (card && !rawCallouts.some((c) => c.mint === card.mint && c.calledAt === card.calledAt)) {
              rawCallouts.push(card);
            }
          }
          break; // Stop after first successful global feed
        } else {
          errors.push({
            source: url,
            status: res.status,
            message: "Empty array returned for global callouts feed",
          });
        }
      } else {
        errors.push({
          source: url,
          status: res.status,
          message: `HTTP ${res.status}: ${res.statusText || "Global callouts fetch failed"}`,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      errors.push({
        source: url,
        message,
      });
    }
  }

  // -------------------------------------------------------------
  // 3. Fetch Leaderboard / Top Callers
  // -------------------------------------------------------------
  const leaderboardEndpoints = [
    "https://frontend-api-v3.pump.fun/callout/leaderboard",
    "https://advanced-api-v2.pump.fun/callout/leaderboard",
    "https://frontend-api-v3.pump.fun/callouts/leaderboard",
    "https://advanced-api-v2.pump.fun/callouts/leaderboard",
  ];

  for (const url of leaderboardEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: baseHeaders,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.leaderboard)
          ? json.leaderboard
          : Array.isArray(json?.callers)
          ? json.callers
          : Array.isArray(json?.data)
          ? json.data
          : [];

        if (list.length > 0) {
          list.forEach((item: Record<string, unknown>, idx: number) => {
            topCallers.push(normalizeTopCaller(item, idx + 1, watchLabels));
          });
          break; // Stop after first successful leaderboard response
        } else {
          errors.push({
            source: url,
            status: res.status,
            message: "Empty leaderboard array returned",
          });
        }
      } else {
        errors.push({
          source: url,
          status: res.status,
          message: `HTTP ${res.status}: ${res.statusText || "Leaderboard fetch failed"}`,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      errors.push({
        source: url,
        message,
      });
    }
  }

  // -------------------------------------------------------------
  // 4. DexScreener Financial Metrics Enrichment
  // -------------------------------------------------------------
  const enrichedCallouts = await enrichWithDexScreener(rawCallouts);

  // Check for authentication / authorization failures (401 or Cloudflare 403 or missing JWT)
  const isAuthIssue =
    errors.some((e) => e.status === 401 || e.status === 403) ||
    (!jwt && enrichedCallouts.length === 0);

  const responsePayload: CalloutsApiResponse = {
    updatedAt: Date.now(),
    source: successfulSource,
    callouts: enrichedCallouts,
    topCallers,
    errors,
    authRequired: isAuthIssue,
  };

  // If completely failed due to auth/upstream block, return 502 with structured message
  if (enrichedCallouts.length === 0 && topCallers.length === 0 && isAuthIssue) {
    return NextResponse.json(
      {
        ...responsePayload,
        message:
          "PUMPFUN_JWT required: Upstream pump.fun native callout endpoints require an active JWT session token or returned 401/403.",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }

  return NextResponse.json(responsePayload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
