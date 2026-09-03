import { NextRequest, NextResponse } from "next/server";
import { CalloutCard, WatchedSummary } from "@/lib/types/callouts";
import { getWatchlistMap, DEFAULT_WATCHLIST } from "@/lib/callouts/watchlist";
import profilesCache from "@/lib/callouts/profiles-cache.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

const PUMP_BASE = "https://frontend-api-v3.pump.fun";
const FETCH_TIMEOUT_MS = 5000;

// Maximum age for live callouts: strictly 8 hours (eliminates stale 22-hour-old data)
const MAX_CALLOUT_AGE_MS = 8 * 60 * 60 * 1000;

// Real authentic browser headers matching pump.fun client requests
const PUMP_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Referer": "https://pump.fun/",
  "Origin": "https://pump.fun",
};

// ─── In-memory cumulative store (Live on-chain signals only) ──────────────────
declare global {
  var __batonCumulativeSignals: Map<string, CalloutCard> | undefined;
}
const cumulativeSignalsMap = globalThis.__batonCumulativeSignals ?? new Map<string, CalloutCard>();
globalThis.__batonCumulativeSignals = cumulativeSignalsMap;

function sanitizeIpfsUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.includes("ipfs.io/ipfs/")) {
    return url.replace("https://ipfs.io/ipfs/", "https://cf-ipfs.com/ipfs/");
  }
  return url;
}

function sanitizeAvatarUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.includes("ipfs.io/ipfs/")) {
    return url.replace("https://ipfs.io/ipfs/", "https://pump.mypinata.cloud/ipfs/");
  }
  return url;
}

function isSolanaAddress(addr?: string | null): boolean {
  if (!addr) return false;
  const trimmed = addr.trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed) || /^0x[a-fA-F0-9]{40}$/.test(trimmed);
}

// User-submitted callouts
const userSubmittedCallouts: CalloutCard[] = [];

// ─── Profile cache ────────────────────────────────────────────────────────────
const callerProfilesCache = new Map<
  string,
  { username?: string; profileImage?: string; xUsername?: string; lastFetched: number }
>();

if (typeof profilesCache === "object" && profilesCache !== null) {
  for (const [w, p] of Object.entries(profilesCache as Record<string, any>)) {
    callerProfilesCache.set(w, {
      username: p.username || undefined,
      profileImage: sanitizeAvatarUrl(p.profileImage) || undefined,
      xUsername: p.xUsername || undefined,
      lastFetched: Date.now(),
    });
  }
}

// ─── Real-Time Token Metadata & Live Mcap Cache (DexScreener & Pump.fun) ──────
interface TokenLiveMeta {
  name?: string;
  symbol?: string;
  iconUrl?: string;
  currentMcap?: number;
  currentPriceUsd?: number;
  lastUpdated: number;
}

const liveTokenMetaCache = new Map<string, TokenLiveMeta>();

async function enrichTokensWithDexScreener(mints: string[]): Promise<void> {
  const now = Date.now();
  const toFetch = Array.from(new Set(mints)).filter((m) => {
    if (!m || !isSolanaAddress(m)) return false;
    const cached = liveTokenMetaCache.get(m);
    // Refresh every 8 seconds, or immediately if missing name/real symbol
    return !cached || now - cached.lastUpdated > 8_000 || !cached.name || cached.symbol === "TOKEN";
  });

  if (toFetch.length === 0) return;

  const chunkSize = 30;
  const chunks: string[][] = [];
  for (let i = 0; i < toFetch.length; i += chunkSize) {
    chunks.push(toFetch.slice(i, i + chunkSize));
  }

  // Parallel fetch all chunks with Promise.all
  await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const res = await fetchWithTimeout(
          `https://api.dexscreener.com/latest/dex/tokens/${chunk.join(",")}`,
          3500
        );
        if (res.ok) {
          const json = await res.json();
          const pairs = Array.isArray(json?.pairs) ? json.pairs : [];
          for (const pair of pairs) {
            const addr = pair.baseToken?.address;
            if (addr && isSolanaAddress(addr)) {
              const mcap = pair.marketCap ?? pair.fdv ?? 0;
              const price = parseFloat(pair.priceUsd || "0") || 0;
              const existing = liveTokenMetaCache.get(addr);
              const metaObj = {
                name: pair.baseToken?.name || existing?.name,
                symbol: pair.baseToken?.symbol?.toUpperCase() || existing?.symbol,
                iconUrl: sanitizeIpfsUrl(pair.info?.imageUrl) || existing?.iconUrl,
                currentMcap: mcap > 0 ? mcap : (existing?.currentMcap || 0),
                currentPriceUsd: price > 0 ? price : (existing?.currentPriceUsd || 0),
                lastUpdated: now,
              };
              liveTokenMetaCache.set(addr, metaObj);
              liveTokenMetaCache.set(addr.toLowerCase(), metaObj);
            }
          }
        }
      } catch {
        // Ignore transient errors
      }
    })
  );
}

async function fetchWithTimeout(url: string, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: PUMP_HEADERS,
      cache: "no-store",
    });
  } finally {
    clearTimeout(id);
  }
}

// ─── Sync Real-Time Callouts from Pump.fun Global Feeds ───────────────────────
let isSyncing = false;
let syncStartedAt = 0;
let lastSyncTime = 0;
let watchlistCursor = 0;

async function syncLivePumpCallouts(force = false): Promise<number> {
  const now = Date.now();
  if (isSyncing && !force && now - syncStartedAt < 8000) return 0;
  isSyncing = true;
  syncStartedAt = now;
  let newCalloutCount = 0;

  try {
    const labelMap = getWatchlistMap();
    const watchlistEntries = Object.entries(labelMap);

    // 1. Fetch Global Home Feed (Offsets 0 and 150, strictly chain=solana)
    const feedOffsets = [0, 150];
    const feedPromises = feedOffsets.map(async (offset) => {
      try {
        const res = await fetchWithTimeout(
          `${PUMP_BASE}/home-feed?pageSize=150&offset=${offset}&chain=solana`,
          5000
        );
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.coins) ? data.coins : [];
      } catch {
        return [];
      }
    });

    // 2. Fetch PnL Leaderboard (Daily & Weekly top caller positions)
    const pnlPromises = ["daily", "weekly"].map(async (period) => {
      try {
        const res = await fetchWithTimeout(
          `${PUMP_BASE}/pnl-leaderboard/positions?period=${period}`,
          5000
        );
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data?.entries) ? data.entries : [];
      } catch {
        return [];
      }
    });

    // 3. Batch 6 watched alpha callers from watchlist
    const batchSize = 6;
    const currentBatch = [];
    for (let i = 0; i < batchSize && watchlistEntries.length > 0; i++) {
      const idx = (watchlistCursor + i) % watchlistEntries.length;
      currentBatch.push(watchlistEntries[idx]);
    }
    watchlistCursor = (watchlistCursor + batchSize) % (watchlistEntries.length || 1);

    const watchlistPromises = currentBatch.map(async ([wallet, label]) => {
      try {
        const res = await fetchWithTimeout(`${PUMP_BASE}/callout/list/${wallet}`, 3500);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.callouts || []).map((c: any) => ({ ...c, callerWallet: wallet, callerLabel: label }));
      } catch {
        return [];
      }
    });

    const [feedResults, pnlResults, watchlistResults] = await Promise.all([
      Promise.all(feedPromises),
      Promise.all(pnlPromises),
      Promise.all(watchlistPromises),
    ]);

    console.log(`[PumpSync] Fetched ${feedResults.reduce((a, b) => a + b.length, 0)} Solana feed coins, ${pnlResults.reduce((a, b) => a + b.length, 0)} pnl entries, ${watchlistResults.reduce((a, b) => a + b.length, 0)} watchlist calls`);

    // Process Home Feed items (STRICT SOLANA ONLY)
    for (const coinList of feedResults) {
      for (const item of coinList) {
        const c = item.position?.callout;
        if (!c || !item.coinMint) continue;
        // Strictly exclude EVM / non-Solana tokens
        if (!isSolanaAddress(item.coinMint)) continue;
        if (item.chain && item.chain !== "solana") continue;

        const pos = item.position;
        const wallet = pos.walletAddress || pos.userId || "";
        const id = c.calloutId || `callout-${item.coinMint}-${wallet.slice(0, 6)}`;

        const callerLabel = pos.userName || labelMap[wallet] || (wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "Solana Trader");
        const avatarUrl = sanitizeAvatarUrl(pos.profileImage);
        const xUsername = pos.xUsername || undefined;

        if (wallet) {
          callerProfilesCache.set(wallet, {
            username: callerLabel,
            profileImage: avatarUrl || undefined,
            xUsername,
            lastFetched: Date.now(),
          });
        }

        const coinImg = sanitizeIpfsUrl(item.coinImage || c.mediaUrl);
        const createdAtMs = c.calloutTimestamp ? new Date(c.calloutTimestamp).getTime() : Date.now();
        // Strictly discard stale callouts older than 8 hours (eliminates old 22h+ data)
        if (Date.now() - createdAtMs > MAX_CALLOUT_AGE_MS) continue;

        if (!cumulativeSignalsMap.has(id)) {
          newCalloutCount++;
        }

        const rawMultiple = Number(c.multiple) || 1.0;
        const currentMcap = Number(item.marketCap) || 0;
        const entryMcap = Number(c.calledOutAtMcap) > 0
          ? Number(c.calledOutAtMcap)
          : (currentMcap > 0 && rawMultiple > 0 ? Math.round(currentMcap / rawMultiple) : Number(c.marketCap) || currentMcap);
        const actualMultiple = entryMcap > 0 && currentMcap > 0 ? Number((currentMcap / entryMcap).toFixed(2)) : rawMultiple;

        if (item.coinMint && currentMcap > 0) {
          const ex = liveTokenMetaCache.get(item.coinMint);
          liveTokenMetaCache.set(item.coinMint, {
            name: item.coinName || item.symbol || ex?.name,
            symbol: (item.symbol || ex?.symbol || "TOKEN").toUpperCase(),
            iconUrl: coinImg || ex?.iconUrl,
            currentMcap,
            currentPriceUsd: Number(item.usdPrice || item.priceUsd) || ex?.currentPriceUsd || 0,
            lastUpdated: now,
          });
        }

        cumulativeSignalsMap.set(id, {
          calloutId: id,
          userId: pos.userId || wallet,
          callerWallet: wallet,
          callerLabel,
          callerAvatarUrl: avatarUrl || undefined,
          callerXUsername: xUsername,
          coinMint: item.coinMint,
          coinName: item.coinName || item.symbol || "Solana Project",
          coinSymbol: (item.symbol || "TOKEN").toUpperCase(),
          marketCap: entryMcap,
          entryMcap,
          currentMcap,
          calloutPrice: c.calloutPrice || 0,
          calloutPriceUsd: c.calloutPrice || 0,
          multiple: actualMultiple,
          createdAt: createdAtMs,
          maxPriceSol: 0,
          maxPriceUsd: 0,
          thesis: c.thesis || "",
          user_uuid: pos.userId || wallet,
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
          mediaUrl: coinImg,
          quotedCalloutId: c.quotedCalloutId || null,
          quotedCallout: c.quotedCallout || null,
          updates: Array.isArray(c.updates) ? c.updates : [],
          updateCount: c.updateCount || (Array.isArray(c.updates) ? c.updates.length : 0),
        });
      }
    }

    // Process PnL Leaderboard items (STRICT SOLANA ONLY)
    for (const entryList of pnlResults) {
      for (const entry of entryList) {
        if (!entry.coinMint) continue;
        if (!isSolanaAddress(entry.coinMint)) continue;
        const c = entry.callout;

        const wallet = entry.walletAddress || entry.userId || "";
        const id = `pnl-${c?.calloutId || `${entry.coinMint}-${wallet.slice(0, 8)}`}`;
        const callerLabel = entry.username || labelMap[wallet] || "Top Alpha";
        const avatarUrl = sanitizeAvatarUrl(entry.profileImage);
        const xUsername = entry.xUsername || undefined;

        if (wallet) {
          callerProfilesCache.set(wallet, {
            username: callerLabel,
            profileImage: avatarUrl || undefined,
            xUsername,
            lastFetched: Date.now(),
          });
        }

        const createdAtMs = c?.calloutTimestamp ? new Date(c.calloutTimestamp).getTime() : Date.now();
        // Keep active leaderboard winning trades (allow up to 7 days for weekly leaderboard)
        if (Date.now() - createdAtMs > 7 * 24 * 60 * 60 * 1000) continue;

        if (!cumulativeSignalsMap.has(id)) {
          newCalloutCount++;
        }

        const rawMultiple = Number(c?.multiple) || 1.0;
        const tradeEntryMcap = Number(entry.avgEntryMcapUsd) > 0 ? Math.round(Number(entry.avgEntryMcapUsd)) : 0;
        const calloutMcap = Number(c?.calledOutAtMcap) > 0 ? Math.round(Number(c.calledOutAtMcap)) : 0;
        const entryMcap = tradeEntryMcap > 0 ? tradeEntryMcap : (calloutMcap > 0 ? calloutMcap : 0);
        const pnlMultiple = entry.pnlPercentage ? Number((1 + entry.pnlPercentage / 100).toFixed(2)) : rawMultiple;
        const thesisText = c?.thesis || (entry.pnlPercentage ? `Verified Leaderboard Trade: +${entry.pnlPercentage.toFixed(1)}% ROI ($${Math.round(entry.pnlUsd || 0).toLocaleString()} profit)` : "Winning position on Pump.fun Leaderboard.");

        cumulativeSignalsMap.set(id, {
          calloutId: id,
          userId: entry.userId || wallet,
          callerWallet: wallet,
          callerLabel,
          callerAvatarUrl: avatarUrl || undefined,
          callerXUsername: xUsername,
          coinMint: entry.coinMint,
          coinName: entry.coinName || "Solana Project",
          coinSymbol: (entry.coinSymbol || "TOKEN").toUpperCase(),
          marketCap: entryMcap,
          entryMcap,
          currentMcap: calloutMcap,
          calloutPrice: c?.calloutPrice || 0,
          calloutPriceUsd: c?.calloutPrice || 0,
          multiple: pnlMultiple > 1 ? pnlMultiple : rawMultiple,
          createdAt: createdAtMs,
          maxPriceSol: 0,
          maxPriceUsd: 0,
          thesis: thesisText,
          user_uuid: entry.userId || wallet,
          isLeaderboardTrade: true,
          likes: c?.likes || 0,
          hasLiked: c?.hasLiked || false,
          hasReposted: c?.hasReposted || false,
          repostCount: c?.repostCount || 0,
          quoteCount: c?.quoteCount || 0,
          commentCount: c?.commentCount || 0,
          replyCount: c?.replyCount || 0,
          maxMultiplier: Number(c?.maxMultiplier) || Number(c?.multiple) || pnlMultiple || 1.0,
          maxMultiplierAt: c?.maxMultiplierAt || new Date().toISOString(),
          viewCount: c?.viewCount || 0,
          mediaUrl: sanitizeIpfsUrl(c?.mediaUrl),
          quotedCalloutId: c?.quotedCalloutId || null,
          quotedCallout: c?.quotedCallout || null,
          updates: Array.isArray(c?.updates) ? c.updates : [],
          updateCount: c?.updateCount || 0,
        });
      }
    }

    // Process Watchlist Alpha Caller direct callouts (STRICT SOLANA ONLY)
    for (const callerCallouts of watchlistResults) {
      for (const c of callerCallouts) {
        if (!c || !c.coinMint) continue;
        if (!isSolanaAddress(c.coinMint)) continue;
        const wallet = c.callerWallet || c.userId || "";
        const id = c.calloutId || `callout-${c.coinMint}-${wallet.slice(0, 6)}`;
        const prof = wallet ? callerProfilesCache.get(wallet) : null;
        const callerLabel = prof?.username || (c.callerLabel && c.callerLabel !== "Alpha Caller" ? c.callerLabel : "") || labelMap[wallet] || (wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "Solana Trader");

        const createdAtMs = typeof c.createdAt === "number" ? c.createdAt : (c.calloutTimestamp ? new Date(c.calloutTimestamp).getTime() : Date.now());
        // Strictly discard stale callouts older than 8 hours (eliminates old 22h+ data)
        if (Date.now() - createdAtMs > MAX_CALLOUT_AGE_MS) continue;

        if (!cumulativeSignalsMap.has(id)) {
          newCalloutCount++;
        }

        const rawMultiple = Number(c.multiple) || 1.0;
        const entryMcap = Number(c.calledOutAtMcap) || Number(c.marketCap) || 0;
        const currentMcap = 0;

        cumulativeSignalsMap.set(id, {
          calloutId: id,
          userId: wallet,
          callerWallet: wallet,
          callerLabel,
          callerAvatarUrl: prof?.profileImage,
          callerXUsername: prof?.xUsername,
          coinMint: c.coinMint,
          coinName: c.coinName || c.name || "Solana Project",
          coinSymbol: (c.coinSymbol || c.symbol || "TOKEN").toUpperCase(),
          marketCap: entryMcap,
          entryMcap,
          currentMcap,
          calloutPrice: c.calloutPrice || 0,
          calloutPriceUsd: c.calloutPriceUsd || c.calloutPrice || 0,
          multiple: rawMultiple,
          createdAt: createdAtMs,
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
          mediaUrl: sanitizeIpfsUrl(c.mediaUrl),
          quotedCalloutId: c.quotedCalloutId || null,
          quotedCallout: c.quotedCallout || null,
          updates: Array.isArray(c.updates) ? c.updates : [],
          updateCount: c.updateCount || 0,
        });
      }
    }

    lastSyncTime = Date.now();
  } catch (err) {
    console.error("[CalloutSync] Error:", err);
  } finally {
    isSyncing = false;
  }

  return newCalloutCount;
}

// ─── Background auto-refresh loop ─────────────────────────────────────────────
// ─── Fast In-Memory API Cache ────────────────────────────────────────────────
let cachedJsonResponse: any = null;
let cachedJsonTimestamp = 0;

// ─── GET handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const labelMap = getWatchlistMap();
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "1" || searchParams.get("refresh") === "true";

  // If cached in memory and fresh (< 3.5s), return in 1ms!
  if (!forceRefresh && cachedJsonResponse && Date.now() - cachedJsonTimestamp < 3500) {
    return NextResponse.json(cachedJsonResponse, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  // If cold start (no data yet), await initial fetch once
  if (cumulativeSignalsMap.size === 0 || lastSyncTime === 0) {
    await syncLivePumpCallouts(true);
  } else if (forceRefresh || Date.now() - lastSyncTime > 5000) {
    // Non-blocking background sync! Return current data in 2ms, sync in background!
    syncLivePumpCallouts(forceRefresh).catch(() => {});
  }

  const now = Date.now();
  // Prune signals older than MAX_CALLOUT_AGE_MS (keeps leaderboard winning trades up to 7 days)
  for (const [id, c] of cumulativeSignalsMap.entries()) {
    const isPnlLeaderboard = id.startsWith("pnl-") || id.startsWith("callout-");
    const maxAge = isPnlLeaderboard ? 7 * 24 * 60 * 60 * 1000 : MAX_CALLOUT_AGE_MS;
    if (now - (c.createdAt || 0) > maxAge) {
      cumulativeSignalsMap.delete(id);
    }
  }

  const baseCards = Array.from(cumulativeSignalsMap.values());
  const allCards = [...userSubmittedCallouts, ...baseCards]
    .filter((c) => {
      const isPnlLeaderboard = c.calloutId?.startsWith("pnl-") || c.calloutId?.startsWith("callout-");
      const maxAge = isPnlLeaderboard ? 7 * 24 * 60 * 60 * 1000 : MAX_CALLOUT_AGE_MS;
      return now - (c.createdAt || 0) <= maxAge;
    })
    .map((c) => {
      const prof = c.callerWallet ? callerProfilesCache.get(c.callerWallet) : null;
      return {
        ...c,
        callerLabel: prof?.username || c.callerLabel,
        callerAvatarUrl: prof?.profileImage || c.callerAvatarUrl,
        callerXUsername: prof?.xUsername || c.callerXUsername,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  // Batch-enrich unique active mints with DexScreener live market cap, price, real symbol & name (up to 300 mints in parallel)
  const uniqueMints = Array.from(new Set(allCards.map((c) => c.coinMint).filter(Boolean))).slice(0, 300);
  try {
    await enrichTokensWithDexScreener(uniqueMints);
  } catch {}

  const enrichedCards = allCards.map((c) => {
    const live = liveTokenMetaCache.get(c.coinMint) || (c.coinMint ? liveTokenMetaCache.get(c.coinMint.toLowerCase()) : null);
    
    // 1. Current Live Market Cap from DexScreener or bonding curve
    const currentMcap = live?.currentMcap && live.currentMcap > 0
      ? live.currentMcap
      : (Number(c.currentMcap) > 0 ? Number(c.currentMcap) : Number(c.marketCap) || 0);

    // 2. True Entry Market Cap (prioritize trade entry or calledOutAtMcap)
    let entryMcap = c.entryMcap || (c as any).calledOutAtMcap || 0;
    if (!entryMcap || entryMcap === 0) {
      if (currentMcap > 0 && Number(c.multiple) > 1) {
        entryMcap = Math.round(currentMcap / Number(c.multiple));
      } else {
        entryMcap = currentMcap;
      }
    }

    // 3. Accurate live multiple (Current / Entry)
    const actualMultiple = entryMcap > 0 && currentMcap > 0
      ? Number((currentMcap / entryMcap).toFixed(2))
      : (Number(c.multiple) || 1.0);

    const currentPriceUsd = live?.currentPriceUsd && live.currentPriceUsd > 0
      ? live.currentPriceUsd
      : (c.calloutPriceUsd || 0);

    return {
      ...c,
      coinName: live?.name || (c.coinName && c.coinName !== "Solana Project" ? c.coinName : live?.symbol || c.coinSymbol),
      coinSymbol: live?.symbol || (c.coinSymbol && c.coinSymbol !== "TOKEN" ? c.coinSymbol : live?.name || "TOKEN"),
      mediaUrl: live?.iconUrl || c.mediaUrl,
      marketCap: entryMcap,
      entryMcap,
      currentMcap,
      currentPriceUsd,
      multiple: actualMultiple,
      multiplier: actualMultiple,
    };
  });

  // Combine all known callers: watchlist + all profiles in cache + all callers from signals
  const allKnownWallets = new Map<string, { label: string; avatarUrl?: string; xUsername?: string }>();

  // 1. From labelMap (watchlist)
  for (const [wallet, label] of Object.entries(labelMap)) {
    allKnownWallets.set(wallet, { label });
  }

  // 2. From callerProfilesCache (350+ verified callers)
  for (const [wallet, prof] of callerProfilesCache.entries()) {
    if (prof.username) {
      const existing = allKnownWallets.get(wallet);
      allKnownWallets.set(wallet, {
        label: prof.username || existing?.label || wallet.slice(0, 6),
        avatarUrl: prof.profileImage || existing?.avatarUrl,
        xUsername: prof.xUsername || existing?.xUsername,
      });
    }
  }

  // 3. From enrichedCards
  for (const c of enrichedCards) {
    if (c.callerWallet) {
      const existing = allKnownWallets.get(c.callerWallet);
      allKnownWallets.set(c.callerWallet, {
        label: c.callerLabel || existing?.label || c.callerWallet.slice(0, 6),
        avatarUrl: c.callerAvatarUrl || existing?.avatarUrl,
        xUsername: c.callerXUsername || existing?.xUsername,
      });
    }
  }

  // Count callouts for each caller
  const callerCalloutCounts = new Map<string, number>();
  for (const c of enrichedCards) {
    if (c.callerWallet) {
      callerCalloutCounts.set(c.callerWallet, (callerCalloutCounts.get(c.callerWallet) || 0) + 1);
    }
    if (c.callerLabel) {
      const key = c.callerLabel.toLowerCase();
      callerCalloutCounts.set(key, (callerCalloutCounts.get(key) || 0) + 1);
    }
  }

  const watched: WatchedSummary[] = Array.from(allKnownWallets.entries()).map(([wallet, info]) => {
    const prof = callerProfilesCache.get(wallet);
    const count = callerCalloutCounts.get(wallet) || (info.label ? callerCalloutCounts.get(info.label.toLowerCase()) : 0) || 0;
    return {
      wallet,
      label: prof?.username || info.label,
      count,
      avatarUrl: prof?.profileImage || info.avatarUrl || undefined,
      xUsername: prof?.xUsername || info.xUsername || undefined,
    };
  }).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const responsePayload = {
    success: true,
    updatedAt: lastSyncTime || Date.now(),
    callouts: enrichedCards,
    count: enrichedCards.length,
    watched,
    activeWallets: watched.filter((w) => w.count > 0).length,
    totalWallets: watched.length,
    emptyWallets: [],
    errors: [],
  };

  cachedJsonResponse = responsePayload;
  cachedJsonTimestamp = Date.now();

  return NextResponse.json(
    responsePayload,
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

// ─── POST handler (user submitted callouts) ───────────────────────────────────
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
    };

    userSubmittedCallouts.unshift(newCallout);
    cumulativeSignalsMap.set(newCallout.calloutId, newCallout);

    return NextResponse.json({
      success: true,
      callout: newCallout,
      count: userSubmittedCallouts.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit callout" }, { status: 500 });
  }
}
