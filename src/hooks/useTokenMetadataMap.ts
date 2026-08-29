"use client";

import { useState, useEffect } from "react";

export interface ResolvedTokenMeta {
  mint: string;
  name?: string;
  symbol?: string;
  imageUrl?: string;
  priceUsd?: number;
}

// Global in-memory cache
const globalMetaCache = new Map<string, ResolvedTokenMeta>();
const activeFetches = new Map<string, Promise<ResolvedTokenMeta | null>>();

async function fetchTokenMetadata(mint: string): Promise<ResolvedTokenMeta | null> {
  if (!mint) return null;
  if (globalMetaCache.has(mint)) return globalMetaCache.get(mint)!;

  if (activeFetches.has(mint)) {
    return activeFetches.get(mint)!;
  }

  const promise = (async () => {
    try {
      // 1. Try DexScreener API
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      if (res.ok) {
        const data = await res.json();
        const pair = data.pairs?.[0];
        if (pair?.baseToken?.symbol) {
          const meta: ResolvedTokenMeta = {
            mint,
            name: pair.baseToken.name || pair.baseToken.symbol,
            symbol: pair.baseToken.symbol,
            imageUrl: pair.info?.imageUrl,
            priceUsd: Number(pair.priceUsd) || undefined,
          };
          globalMetaCache.set(mint, meta);
          return meta;
        }
      }

      // 2. Fallback to Pump.fun API
      const pumpRes = await fetch(`https://frontend-api-v3.pump.fun/coins/${mint}`);
      if (pumpRes.ok) {
        const pumpData = await pumpRes.json();
        if (pumpData?.symbol) {
          const meta: ResolvedTokenMeta = {
            mint,
            name: pumpData.name || pumpData.symbol,
            symbol: pumpData.symbol,
            imageUrl: pumpData.image_uri,
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
