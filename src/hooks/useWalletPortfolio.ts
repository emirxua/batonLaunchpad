"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export interface WalletTokenHolding {
  mint: string;
  name: string;
  symbol: string;
  iconUrl: string;
  amount: number;
  decimals: number;
  priceUsd: number;
  valueUsd: number;
  priceChange24h: number;
}

export interface WalletPortfolioData {
  wallet: string;
  sol: {
    amount: number;
    priceUsd: number;
    valueUsd: number;
  };
  tokens: WalletTokenHolding[];
  tokenCount: number;
  totalPortfolioUsd: number;
  timestamp: number;
}

export function useWalletPortfolio() {
  const { publicKey, connected } = useWallet();
  const [portfolio, setPortfolio] = useState<WalletPortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchPortfolio = useCallback(async (showRefreshing = false) => {
    if (!publicKey || !connected) {
      setPortfolio(null);
      return;
    }

    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`/api/wallet-portfolio?wallet=${encodeURIComponent(publicKey.toBase58())}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setPortfolio(data);
        }
      }
    } catch (err) {
      console.warn("[useWalletPortfolio] Fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [publicKey, connected]);

  useEffect(() => {
    fetchPortfolio();
    // Auto refresh every 25 seconds
    const timer = setInterval(() => {
      fetchPortfolio(false);
    }, 25000);
    return () => clearInterval(timer);
  }, [fetchPortfolio]);

  return {
    portfolio,
    isLoading,
    isRefreshing,
    refresh: () => fetchPortfolio(true),
  };
}
