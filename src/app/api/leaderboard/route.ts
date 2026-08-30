import { NextResponse } from "next/server";
import { TRACKED_COINS } from "@/lib/tracked-coins";
import { getBurnLevel } from "@/lib/burn-levels";
import { Coin } from "@/types/coin";

export const dynamic = "force-dynamic";

const DEX = "https://api.dexscreener.com";
const FETCH_MS = 6000;
const LADDER_SIZE = 25;

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

function classifyCategory(symbol: string, name: string, desc: string): string {
  const txt = `${symbol} ${name} ${desc}`.toLowerCase();
  if (/\bai\b|agent|gpt|neural|llm|openai|claude|gemini/.test(txt)) return "Agents";
  if (/defi|swap|lp|yield|vault|farm|dao|governance|stake/.test(txt)) return "DeFi";
  if (/util|tool|infra|protocol|sdk|bridge|oracle/.test(txt)) return "Utility";
  if (/pepe|doge|shib|frog|cat|dog|meme|wojak|ape|moon|pump/.test(txt)) return "Memes";
  return "Mascots";
}

interface BoostEntry {
  chainId: string;
  tokenAddress: string;
  description?: string;
  icon?: string;
  totalAmount?: number;
  links?: { type: string; url: string }[];
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
  const [topBoosts, latestBoosts] = await Promise.all([
    fetchJson<BoostEntry[]>(`${DEX}/token-boosts/top/v1`),
    fetchJson<BoostEntry[]>(`${DEX}/token-boosts/latest/v1`),
  ]);

  const allBoosts = [...(topBoosts ?? []), ...(latestBoosts ?? [])];
  const solanaBoosts = allBoosts.filter((b) => b.chainId === "solana");

  const seen = new Set<string>();
  const uniqueBoosts = solanaBoosts.filter((b) => {
    if (seen.has(b.tokenAddress)) return false;
    seen.add(b.tokenAddress);
    return true;
  });

  const batonConfig = TRACKED_COINS.find((c) => c.ticker === "BATON");
  const batonMint = batonConfig?.mintAddress ?? "";
  if (batonMint && !seen.has(batonMint)) {
    uniqueBoosts.unshift({
      chainId: "solana",
      tokenAddress: batonMint,
      description: batonConfig?.description ?? "",
      icon: batonConfig?.imageUrl,
      totalAmount: 9999,
    });
  }

  const targetMints = uniqueBoosts.slice(0, LADDER_SIZE).map((b) => b.tokenAddress);

  const CHUNK = 10;
  const chunks: string[][] = [];
  for (let i = 0; i < targetMints.length; i += CHUNK) {
    chunks.push(targetMints.slice(i, i + CHUNK));
  }

  const pairMap = new Map<string, DexPair>();
  await Promise.all(
    chunks.map(async (chunk) => {
      const data = await fetchJson<{ pairs?: DexPair[] }>(
        `${DEX}/latest/dex/tokens/${chunk.join(",")}`
      );
      for (const pair of data?.pairs ?? []) {
        if (pair.chainId !== "solana" || !pair.baseToken?.address) continue;
        const addr = pair.baseToken.address;
        const existing = pairMap.get(addr);
        if (!existing || (pair.liquidity?.usd ?? 0) > (existing.liquidity?.usd ?? 0)) {
          pairMap.set(addr, pair);
        }
      }
    })
  );

  const burnsMap: Record<string, number> = {};
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const burnData = await fetchJson<{ recentBurns?: { coinId: string; amount: number }[] }>(
      `${baseUrl}/api/burns`,
      2000
    );
    for (const b of burnData?.recentBurns ?? []) {
      const key = b.coinId?.toLowerCase();
      if (key) {
        burnsMap[key] = (burnsMap[key] || 0) + (b.amount || 0);
      }
    }
  } catch {
    /* not fatal */
  }

  const coins: Coin[] = [];

  for (const boost of uniqueBoosts) {
    const mint = boost.tokenAddress;
    const pair = pairMap.get(mint);
    if (!pair?.baseToken) continue;

    const priceUsd = pair.priceUsd ? parseFloat(pair.priceUsd) : 0;
    const marketCap = pair.marketCap ?? pair.fdv ?? 0;
    const volume24h = pair.volume?.h24 ?? 0;
    const change24h = pair.priceChange?.h24 ?? 0;
    const imageUrl = pair.info?.imageUrl ?? boost.icon ?? undefined;
    const symbol = pair.baseToken.symbol.toUpperCase();
    const name = pair.baseToken.name;
    const desc = boost.description ?? "";
    const isBAton = mint === batonMint;
    const burnedAmount =
      burnsMap[mint.toLowerCase()] ||
      burnsMap[symbol.toLowerCase()] ||
      (isBAton ? burnsMap["baton"] || 0 : 0);
    const category = isBAton ? "Mascots" : classifyCategory(symbol, name, desc);
    const twitterLink = boost.links?.find((l) => l.type === "twitter")?.url;
    const websiteLink = boost.links?.find((l) => l.type === "website")?.url;

    coins.push({
      id: isBAton ? "baton-primary" : `dex-${mint.slice(0, 8)}`,
      name,
      ticker: symbol,
      mintAddress: mint,
      imageUrl,
      iconColor: isBAton ? "#ff3d7a" : "#f97316",
      category,
      description: desc,
      website: isBAton ? batonConfig?.website : websiteLink,
      twitter: isBAton ? batonConfig?.twitter : twitterLink,
      priceUsd,
      marketCap,
      volume24h,
      change24h,
      sparkline: [],
      totalBurnedBaton: burnedAmount,
      burnLevel: getBurnLevel(burnedAmount),
      pairAddress: pair.pairAddress,
      liquidityUsd: pair.liquidity?.usd ?? 0,
      viewsCount: 0,
    });
  }

  coins.sort((a, b) => {
    if (a.id === "baton-primary") return -1;
    if (b.id === "baton-primary") return 1;
    return (b.marketCap ?? 0) - (a.marketCap ?? 0);
  });

  return NextResponse.json(
    {
      success: true,
      updatedAt: Date.now(),
      count: coins.length,
      coins,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}
