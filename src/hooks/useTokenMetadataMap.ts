"use client";

import { useState, useEffect } from "react";

export interface ResolvedTokenMeta {
  mint: string;
  name?: string;
  symbol?: string;
  imageUrl?: string;
  priceUsd?: number;
}

function normalizeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
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

// Global in-memory cache — only real, verified tokens are pre-seeded.
const globalMetaCache = new Map<string, ResolvedTokenMeta>([
  [
    "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
    {
      mint: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
      name: "Baton",
      symbol: "BATON",
      imageUrl: "/images/baton-logo.png",
      priceUsd: undefined,
    },
  ],
]);
const activeFetches = new Map<string, Promise<ResolvedTokenMeta | null>>();

async function fetchTokenMetadata(mint: string): Promise<ResolvedTokenMeta | null> {
  if (!mint) return null;
  if (globalMetaCache.has(mint)) return globalMetaCache.get(mint)!;

  if (activeFetches.has(mint)) {
    return activeFetches.get(mint)!;
  }

  const promise = (async () => {
    try {
      // 1. Primary: Server-side token lookup API with pump.fun + DexScreener fallback
      try {
        const lookupRes = await fetch(`/api/token-lookup?mint=${encodeURIComponent(mint)}`);
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          if (lookupData?.symbol) {
            const meta: ResolvedTokenMeta = {
              mint,
              name: lookupData.name || lookupData.symbol,
              symbol: lookupData.symbol,
              imageUrl: normalizeUrl(lookupData.iconUrl),
              priceUsd: lookupData.priceUsd || undefined,
            };
            globalMetaCache.set(mint, meta);
            return meta;
          }
        }
      } catch {
        // Fallback to direct APIs
      }

      // 2. Direct Pump.fun API
      if (mint.toLowerCase().endsWith("pump")) {
        try {
          const pumpRes = await fetch(`https://frontend-api-v3.pump.fun/coins/${mint}`, {
            headers: { Accept: "application/json" },
          });
          if (pumpRes.ok) {
            const pumpData = await pumpRes.json();
            if (pumpData?.symbol) {
              const meta: ResolvedTokenMeta = {
                mint,
                name: pumpData.name || pumpData.symbol,
                symbol: pumpData.symbol,
                imageUrl: normalizeUrl(pumpData.image_uri),
              };
              globalMetaCache.set(mint, meta);
              return meta;
            }
          }
        } catch {
          // ignore
        }
      }

      // 3. Direct DexScreener API
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      if (res.ok) {
        const data = await res.json();
        const pair = data.pairs?.[0];
        if (pair?.baseToken?.symbol) {
          const meta: ResolvedTokenMeta = {
            mint,
            name: pair.baseToken.name || pair.baseToken.symbol,
            symbol: pair.baseToken.symbol,
            imageUrl: normalizeUrl(pair.info?.imageUrl),
            priceUsd: Number(pair.priceUsd) || undefined,
          };
          globalMetaCache.set(mint, meta);
          return meta;
        }
      }
    } catch (e) {
      console.warn(`Could not resolve token metadata for ${mint}:`, e);
    } finally {
      activeFetches.delete(mint);
    }
    return null;
  })();

  activeFetches.set(mint, promise);
  return promise;
}

/**
 * Hook to resolve metadata for a list of mints dynamically without mock data
 */
export function useTokenMetadataMap(mints: string[]) {
  const [metaMap, setMetaMap] = useState<Record<string, ResolvedTokenMeta>>(() => {
    const initial: Record<string, ResolvedTokenMeta> = {};
    for (const m of mints) {
      if (globalMetaCache.has(m)) {
        initial[m] = globalMetaCache.get(m)!;
      }
    }
    return initial;
  });

  useEffect(() => {
    const uniqueMints = Array.from(new Set(mints.filter(Boolean)));
    const needed = uniqueMints.filter((m) => !metaMap[m]);

    if (needed.length === 0) return;

    let isMounted = true;

    // Fetch batch
    Promise.all(needed.map((m) => fetchTokenMetadata(m))).then((results) => {
      if (!isMounted) return;
      setMetaMap((prev) => {
        const updated = { ...prev };
        results.forEach((res) => {
          if (res) {
            updated[res.mint] = res;
          }
        });
        return updated;
      });
    });

    return () => {
      isMounted = false;
    };
  }, [mints]);

  return metaMap;
}

export function getTokenMetadataFromCache(mint: string): ResolvedTokenMeta | null {
  return globalMetaCache.get(mint) || null;
}
