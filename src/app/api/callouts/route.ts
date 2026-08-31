import { NextRequest, NextResponse } from "next/server";
import { CalloutCard, PumpCalloutListResponse, WatchedSummary } from "@/lib/types/callouts";
import { getWatchlistMap, DEFAULT_WATCHLIST } from "@/lib/callouts/watchlist";

export const dynamic = "force-dynamic";
export const revalidate = 15;

const PUMP_BASE = "https://frontend-api-v3.pump.fun";
const DEX_BASE = "https://api.dexscreener.com";
const FETCH_TIMEOUT_MS = 4000;

// Persistent in-memory storage for user-submitted community callouts
let userSubmittedCallouts: CalloutCard[] = [];

// In-memory cache for live alpha signals
let cachedSignals: { data: CalloutCard[]; time: number } | null = null;

async function fetchWithTimeout(url: string, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch real callouts from Cloudflare Worker proxy
 */
async function fetchRealCalloutsFromProxy(): Promise<CalloutCard[]> {
  const proxyUrl =
    process.env.CALLOUT_PROXY_BASE ||
    process.env.NEXT_PUBLIC_CALLOUT_PROXY_URL ||
    "https://pump-callout-proxy.emir1903topuz106.workers.dev/";

  try {
    const res = await fetchWithTimeout(proxyUrl, 4500);
    if (!res.ok) return [];

    const data = await res.json();
    const labelMap = getWatchlistMap();
    const rawResults = Array.isArray(data?.results) ? data.results : [];
    const list: CalloutCard[] = [];

    for (const item of rawResults) {
      const wallet = item.wallet;
      if (!wallet) continue;
      const label =
        labelMap[wallet] ??
        DEFAULT_WATCHLIST[wallet] ??
        `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;

      const isOk = item.ok !== false && (!item.status || item.status === 200);
      if (!isOk) continue;

      const calloutsList = Array.isArray(item.callouts) ? item.callouts : [];
      for (const c of calloutsList) {
        if (!c || !c.coinMint) continue;
        list.push({
          calloutId: c.calloutId || `callout-${c.coinMint}-${wallet.slice(0, 6)}`,
          userId: wallet,
          callerWallet: wallet,
          callerLabel: label,
          coinMint: c.coinMint,
          coinName: c.coinName || c.name || "Solana Project",
          coinSymbol: (c.coinSymbol || c.symbol || "TOKEN").toUpperCase(),
          marketCap: c.marketCap || 0,
          calloutPrice: c.calloutPrice || 0,
          calloutPriceUsd: c.calloutPriceUsd || 0,
          multiple: Number(c.multiple) || 1.0,
          createdAt: c.createdAt || Date.now(),
          maxPriceSol: c.maxPriceSol || 0,
          maxPriceUsd: c.maxPriceUsd || 0,
          thesis: c.thesis || "",
          user_uuid: c.user_uuid || `user-${wallet.slice(0, 6)}`,
          likes: c.likes || 0,
          hasLiked: c.hasLiked || false,
          hasReposted: c.hasReposted || false,
          repostCount: c.repostCount || 0,
          quoteCount: c.quoteCount || 0,
          commentCount: c.commentCount || 0,
          replyCount: c.replyCount || 0,
          maxMultiplier: Number(c.maxMultiplier) || Number(c.multiple) || 1.0,
          maxMultiplierAt: c.maxMultiplierAt || new Date().toISOString(),
          viewCount: c.viewCount || 0,
          mediaUrl: c.mediaUrl || null,
          quotedCalloutId: c.quotedCalloutId || null,
          quotedCallout: c.quotedCallout || null,
          updates: Array.isArray(c.updates) ? c.updates : [],
          updateCount: c.updateCount || 0,
        });
      }
    }

    return list;
  } catch (err) {
    console.warn("[callouts] Proxy fetch error:", err);
    return [];
  }
}

/**
 * Fallback direct safe fetch from individual pump caller wallet
 */
async function fetchCallerCalloutsSafe(
  wallet: string,
  label: string
): Promise<CalloutCard[]> {
  try {
    const res = await fetchWithTimeout(`${PUMP_BASE}/callout/list/${wallet}`, 2500);
    if (!res.ok) return [];

    const json: PumpCalloutListResponse = await res.json();
    const callouts = json.callouts ?? [];

    return callouts.map((c: any) => ({
      calloutId: c.calloutId || `callout-${c.coinMint}-${wallet.slice(0, 6)}`,
      userId: wallet,
      callerWallet: wallet,
      callerLabel: label,
      coinMint: c.coinMint,
      coinName: c.coinName || c.name || "Solana Project",
      coinSymbol: (c.coinSymbol || c.symbol || "TOKEN").toUpperCase(),
      marketCap: c.marketCap || 0,
      calloutPrice: c.calloutPrice || 0,
      calloutPriceUsd: c.calloutPriceUsd || 0,
      multiple: Number(c.multiple) || 1.0,
      createdAt: c.createdAt || Date.now(),
      maxPriceSol: c.maxPriceSol || 0,
      maxPriceUsd: c.maxPriceUsd || 0,
      thesis: c.thesis || "",
      user_uuid: c.user_uuid || `user-${wallet.slice(0, 6)}`,
      likes: c.likes || 0,
      hasLiked: c.hasLiked || false,
      hasReposted: c.hasReposted || false,
      repostCount: c.repostCount || 0,
      quoteCount: c.quoteCount || 0,
      commentCount: c.commentCount || 0,
      replyCount: c.replyCount || 0,
      maxMultiplier: Number(c.maxMultiplier) || Number(c.multiple) || 1.0,
      maxMultiplierAt: c.maxMultiplierAt || new Date().toISOString(),
      viewCount: c.viewCount || 0,
      mediaUrl: c.mediaUrl || null,
      quotedCalloutId: c.quotedCalloutId || null,
      quotedCallout: c.quotedCallout || null,
      updates: Array.isArray(c.updates) ? c.updates : [],
      updateCount: c.updateCount || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Enriches all callouts with real DexScreener & Pump.fun metadata (symbols, names, icons)
 */
async function enrichCalloutMetadata(cards: CalloutCard[]): Promise<CalloutCard[]> {
  const uniqueMints = Array.from(new Set(cards.map((c) => c.coinMint).filter(Boolean)));
  if (uniqueMints.length === 0) return cards;

  const metadataMap = new Map<
    string,
    { symbol?: string; name?: string; imageUrl?: string; priceUsd?: number; mcap?: number }
  >();

  // 1. Fetch from DexScreener in chunks of 30 for ALL mints
  const chunkSize = 30;
  for (let i = 0; i < uniqueMints.length; i += chunkSize) {
    const chunk = uniqueMints.slice(i, i + chunkSize);
    try {
      const res = await fetchWithTimeout(`${DEX_BASE}/latest/dex/tokens/${chunk.join(",")}`, 3500);
      if (res.ok) {
        const data = await res.json();
        const pairs: any[] = Array.isArray(data?.pairs) ? data.pairs : [];
        for (const p of pairs) {
          if (p.chainId === "solana" && p.baseToken?.address) {
            const addr = p.baseToken.address;
            const existing = metadataMap.get(addr);
            if (!existing || (p.info?.imageUrl && !existing.imageUrl) || (p.liquidity?.usd ?? 0) > 0) {
              metadataMap.set(addr, {
                symbol: p.baseToken.symbol,
                name: p.baseToken.name,
                imageUrl: p.info?.imageUrl,
                priceUsd: p.priceUsd ? parseFloat(p.priceUsd) : undefined,
                mcap: p.marketCap || p.fdv,
              });
            }
          }
        }
      }
    } catch {
      /* continue */
    }
  }

  // 2. For mints still missing real metadata, query pump.fun coin endpoint directly
  const missingMints = uniqueMints.filter((m) => {
    const meta = metadataMap.get(m);
    return !meta || !meta.symbol || !meta.name;
  });

  if (missingMints.length > 0) {
    const pumpPromises = missingMints.slice(0, 40).map(async (mint) => {
      try {
        const res = await fetchWithTimeout(`${PUMP_BASE}/coins/${mint}`, 2500);
        if (res.ok) {
          const coin = await res.json();
          if (coin && coin.symbol) {
            metadataMap.set(mint, {
              symbol: String(coin.symbol).toUpperCase(),
              name: coin.name || coin.symbol,
              imageUrl: coin.image_uri,
              priceUsd: coin.usd_market_cap ? Number(coin.usd_market_cap) / 1_000_000_000 : undefined,
              mcap: Number(coin.usd_market_cap) || undefined,
            });
          }
        }
      } catch {
        /* continue */
      }
    });
    await Promise.allSettled(pumpPromises);
  }

  return cards
    .map((c) => {
      const meta = metadataMap.get(c.coinMint);
      const isBadSymbol = (s?: string) => !s || s.startsWith("0x") || s.length < 2 || s.toLowerCase() === c.coinMint.slice(0, 4).toLowerCase();
      
      const realSymbol = meta?.symbol || (!isBadSymbol(c.coinSymbol) ? c.coinSymbol : undefined);
      const realName = meta?.name || (c.coinName && c.coinName !== "Solana Token" ? c.coinName : realSymbol || "Solana Project");

      let img = meta?.imageUrl || c.mediaUrl || null;
      if (img && img.includes("ipfs.io")) {
        img = img.replace("https://ipfs.io/ipfs/", "https://cf-ipfs.com/ipfs/");
      }
      if (c.coinMint === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump") {
        img = "/images/baton-logo.png";
      }

      return {
        ...c,
        coinSymbol: realSymbol || c.coinSymbol || (meta?.name ? meta.name.slice(0, 6).toUpperCase() : "TOKEN"),
        coinName: realName,
        mediaUrl: img,
      };
    })
    .filter((c) => {
      // Filter out invalid/unresolved address artifacts
      if (!c.coinSymbol || c.coinSymbol.startsWith("0x")) return false;
      return true;
    });
}

export async function GET() {
  const labelMap = getWatchlistMap();
  const now = Date.now();

  // Return cached signals if under 20s
  if (cachedSignals && now - cachedSignals.time < 20_000 && cachedSignals.data.length > 0) {
    const merged = [...userSubmittedCallouts, ...cachedSignals.data];
    return NextResponse.json({
      success: true,
      updatedAt: cachedSignals.time,
      callouts: merged,
      count: merged.length,
      watched: Object.entries(labelMap).map(([wallet, label]) => ({
        wallet,
        label,
        count: merged.filter((c) => c.callerWallet === wallet).length,
      })),
      activeWallets: Object.keys(labelMap).length,
      totalWallets: Object.keys(labelMap).length,
    });
  }

  // 1. Fetch real callouts from Cloudflare worker proxy
  let realCallouts = await fetchRealCalloutsFromProxy();

  // 2. If proxy had no callouts or failed, try direct caller endpoints
  if (realCallouts.length === 0) {
    const callerPromises = Object.entries(labelMap).slice(0, 5).map(([w, l]) =>
      fetchCallerCalloutsSafe(w, l)
    );
    const callerResults = await Promise.allSettled(callerPromises);
    callerResults.forEach((r) => {
      if (r.status === "fulfilled") realCallouts.push(...r.value);
    });
  }

  const combined = [...realCallouts].sort((a, b) => b.createdAt - a.createdAt);
  const enriched = await enrichCalloutMetadata(combined);

  if (enriched.length > 0) {
    cachedSignals = { data: enriched, time: now };
  }

  const allCards = [...userSubmittedCallouts, ...enriched];

  const watched: WatchedSummary[] = Object.entries(labelMap).map(([wallet, label]) => ({
    wallet,
    label,
    count: allCards.filter((c) => c.callerWallet === wallet).length,
  }));

  return NextResponse.json(
    {
      success: true,
      updatedAt: Date.now(),
      callouts: allCards,
      count: allCards.length,
      watched,
      activeWallets: watched.filter((w) => w.count > 0).length,
      totalWallets: Object.keys(labelMap).length,
      emptyWallets: [],
      errors: [],
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tokenCA,
      tokenSymbol,
      tokenName,
      entryPrice,
      entryMcap,
      thesis,
      burnAmount,
      callerWallet,
      callerName,
    } = body;

    if (!tokenCA) {
      return NextResponse.json({ error: "tokenCA is required" }, { status: 400 });
    }

    const shortWallet = callerWallet
      ? `${callerWallet.slice(0, 4)}…${callerWallet.slice(-4)}`
      : "anon_alpha";

    const symbolClean = (tokenSymbol || tokenCA.slice(0, 4)).toUpperCase();
    const numPrice = parseFloat(entryPrice) || 0.0000125;
    const numMcap = parseFloat(entryMcap) || 15000;

    const newCallout: CalloutCard = {
      calloutId: `callout-user-${Date.now()}`,
      userId: callerWallet || "user-wallet",
      callerWallet: callerWallet || "user-wallet",
      callerLabel: callerName || `Degen (${shortWallet})`,
      coinMint: tokenCA.trim(),
      coinName: tokenName || `${symbolClean} Token`,
      coinSymbol: symbolClean,
      marketCap: numMcap,
      calloutPrice: numPrice / 150,
      calloutPriceUsd: numPrice,
      multiple: 1.0,
      createdAt: Date.now(),
      maxPriceSol: numPrice / 150,
      maxPriceUsd: numPrice,
      thesis: thesis || "Community callout on Baton Terminal.",
      user_uuid: `user-${shortWallet}`,
      likes: 1,
      hasLiked: true,
      hasReposted: false,
      repostCount: 0,
      quoteCount: 0,
      commentCount: 0,
      replyCount: 0,
      maxMultiplier: 1.0,
      maxMultiplierAt: new Date().toISOString(),
      viewCount: 1,
      mediaUrl: null,
      quotedCalloutId: null,
      quotedCallout: null,
      updates: [],
      updateCount: 0,
    } as any;

    userSubmittedCallouts.unshift(newCallout);

    return NextResponse.json({
      success: true,
      callout: newCallout,
      count: userSubmittedCallouts.length,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to submit callout" }, { status: 500 });
  }
}
