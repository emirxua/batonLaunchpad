import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PUMP_BASE = "https://frontend-api-v3.pump.fun";
const PUMP_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "application/json",
  Referer: "https://pump.fun/",
  Origin: "https://pump.fun",
};

// In-memory cache to guarantee ~1ms response speed
const leaderboardCache: Record<
  string,
  {
    timestamp: number;
    data: any;
  }
> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") === "weekly" ? "weekly" : "daily";
  const now = Date.now();

  const cached = leaderboardCache[period];
  if (cached && now - cached.timestamp < 2000) {
    return NextResponse.json(cached.data);
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4500);

    const [tradersRes, positionsRes] = await Promise.all([
      fetch(`${PUMP_BASE}/pnl-leaderboard?period=${period}&limit=50`, {
        headers: PUMP_HEADERS,
        signal: ctrl.signal,
        cache: "no-store",
      }),
      fetch(`${PUMP_BASE}/pnl-leaderboard/positions?period=${period}`, {
        headers: PUMP_HEADERS,
        signal: ctrl.signal,
        cache: "no-store",
      }).catch(() => null),
    ]);
    clearTimeout(timer);

    if (!tradersRes.ok) {
      if (cached) return NextResponse.json(cached.data);
      return NextResponse.json({ success: false, entries: [] }, { status: 500 });
    }

    const data = await tradersRes.json();
    const rawEntries = Array.isArray(data?.entries) ? data.entries : [];

    let positionsMap = new Map<string, any>();
    try {
      if (positionsRes && positionsRes.ok) {
        const posData = await positionsRes.json();
        const posList = Array.isArray(posData?.entries) ? posData.entries : [];
        for (const p of posList) {
          const w = (p.walletAddress || p.userId || "").toLowerCase();
          const u = (p.username || "").toLowerCase();
          if (w && !positionsMap.has(w)) positionsMap.set(w, p);
          if (u && !positionsMap.has(u)) positionsMap.set(u, p);
        }
      }
    } catch {}

    // Batch-enrich matched winning coins via DexScreener
    const mintsToEnrich = Array.from(new Set(Array.from(positionsMap.values()).map((p: any) => p.coinMint).filter(Boolean))).slice(0, 60);
    const tokenInfoMap = new Map<string, { symbol: string; name: string; iconUrl?: string; mcap?: number; price?: number }>();
    if (mintsToEnrich.length > 0) {
      try {
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintsToEnrich.join(",")}`, {
          headers: PUMP_HEADERS,
          cache: "no-store",
        });
        if (dexRes.ok) {
          const dexJson = await dexRes.json();
          const pairs = Array.isArray(dexJson?.pairs) ? dexJson.pairs : [];
          for (const pair of pairs) {
            const addr = pair.baseToken?.address;
            if (addr && !tokenInfoMap.has(addr.toLowerCase())) {
              tokenInfoMap.set(addr.toLowerCase(), {
                symbol: pair.baseToken?.symbol?.toUpperCase() || "TOKEN",
                name: pair.baseToken?.name || pair.baseToken?.symbol || "Solana Project",
                iconUrl: pair.info?.imageUrl,
                mcap: pair.marketCap ?? pair.fdv ?? 0,
                price: parseFloat(pair.priceUsd || "0") || 0,
              });
            }
          }
        }
      } catch {}
    }

    const entries = rawEntries.map((entry: any, index: number) => {
      const pnlUsd = Number(entry.pnlUsd) || 0;
      const pnlPct = Number(entry.pnlPercent) || Number(entry.pnlPercentage) || 0;
      const wallet = entry.walletAddress || entry.userId || "";
      const posMatch = positionsMap.get(wallet.toLowerCase()) || positionsMap.get((entry.username || "").toLowerCase());
      const callout = posMatch?.callout || null;
      const coinAddr = posMatch?.coinMint;
      const dexInfo = coinAddr ? tokenInfoMap.get(coinAddr.toLowerCase()) : null;
      const coinSymbol = dexInfo?.symbol || (posMatch?.coinSymbol || (callout as any)?.symbol || (coinAddr ? "TOKEN" : undefined));
      const coinName = dexInfo?.name || posMatch?.coinName || (callout as any)?.name || undefined;
      const coinIconUrl = dexInfo?.iconUrl || posMatch?.coinImage || undefined;

      return {
        rank: entry.rank || index + 1,
        walletAddress: wallet,
        username: entry.username || (wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "Top Alpha"),
        profileImage: entry.profileImage || undefined,
        xUsername: entry.xUsername || undefined,
        isVerified: Boolean(entry.isVerified),
        userId: entry.userId || wallet,
        coinMint: coinAddr || undefined,
        coinSymbol: coinSymbol ? coinSymbol.toUpperCase() : undefined,
        coinName,
        coinIconUrl,
        pnlUsd,
        pnlSol: Number(entry.pnlSol) || 0,
        pnlPercentage: pnlPct,
        realizedPnlUsd: Number(entry.realizedPnlUsd) || 0,
        unrealizedPnlUsd: Number(entry.unrealizedPnlUsd) || 0,
        buySpendSol: Number(entry.buySpendSol) || 0,
        costBasisUsd: Number(posMatch?.costBasisUsd) || 0,
        valueUsd: Number(entry.unrealizedPnlUsd) > 0 ? Number(entry.unrealizedPnlUsd) : (Number(posMatch?.valueUsd) || 0),
        callout: callout
          ? {
              calloutId: callout.calloutId,
              calledOutAtMcap: Number(callout.calledOutAtMcap) || 0,
              multiple: Number(callout.multiple) || 1.0,
              thesis: callout.thesis || "",
              calloutTimestamp: callout.calloutTimestamp || new Date().toISOString(),
              likes: callout.likes || 0,
              viewCount: callout.viewCount || 0,
            }
          : null,
      };
    });

    const responsePayload = {
      success: true,
      period,
      periodLabel: data?.periodLabel || (period === "weekly" ? "7d" : "24h"),
      totalRanked: data?.totalRanked || entries.length,
      updatedAt: now,
      entries,
    };

    leaderboardCache[period] = {
      timestamp: now,
      data: responsePayload,
    };

    return NextResponse.json(responsePayload, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
      },
    });
  } catch (err: any) {
    if (cached) return NextResponse.json(cached.data);
    return NextResponse.json({ success: false, error: err?.message, entries: [] }, { status: 500 });
  }
}
