"use client";

import { useState, useEffect, useCallback } from "react";

const TOKEN_STORAGE_KEY = "baton_watchlist_tokens_v1";
const CALLER_STORAGE_KEY = "baton_watchlist_callers_v1";

export function useWatchlist() {
  const [watchedTokens, setWatchedTokens] = useState<string[]>([]);
  const [watchedCallers, setWatchedCallers] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedTokens) {
        const parsed = JSON.parse(storedTokens);
        if (Array.isArray(parsed)) setWatchedTokens(parsed);
      }

      const storedCallers = localStorage.getItem(CALLER_STORAGE_KEY);
      if (storedCallers) {
        const parsed = JSON.parse(storedCallers);
        if (Array.isArray(parsed)) setWatchedCallers(parsed);
      }
    } catch (e) {
      console.warn("Could not read watchlist from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when state changes
  const saveTokens = useCallback((tokens: string[]) => {
    setWatchedTokens(tokens);
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (e) {
      console.warn("Could not save watchedTokens to localStorage:", e);
    }
  }, []);

  const saveCallers = useCallback((callers: string[]) => {
    setWatchedCallers(callers);
    try {
      localStorage.setItem(CALLER_STORAGE_KEY, JSON.stringify(callers));
    } catch (e) {
      console.warn("Could not save watchedCallers to localStorage:", e);
    }
  }, []);

  const toggleWatchToken = useCallback(
    (mint: string) => {
      if (!mint) return;
      const lower = mint.toLowerCase();
      const exists = watchedTokens.some((m) => m.toLowerCase() === lower);

      if (exists) {
        saveTokens(watchedTokens.filter((m) => m.toLowerCase() !== lower));
      } else {
        saveTokens([...watchedTokens, mint]);
      }
    },
    [watchedTokens, saveTokens]
  );

  const isWatchedToken = useCallback(
    (mint: string): boolean => {
      if (!mint) return false;
      const lower = mint.toLowerCase();
      return watchedTokens.some((m) => m.toLowerCase() === lower);
    },
    [watchedTokens]
  );

  // Alias isWatched for token mint
  const isWatched = isWatchedToken;

  const toggleWatchCaller = useCallback(
    (callerWallet: string) => {
      if (!callerWallet) return;
      const lower = callerWallet.toLowerCase();
      const exists = watchedCallers.some((w) => w.toLowerCase() === lower);

      if (exists) {
        saveCallers(watchedCallers.filter((w) => w.toLowerCase() !== lower));
      } else {
        saveCallers([...watchedCallers, callerWallet]);
      }
    },
    [watchedCallers, saveCallers]
  );

  const isWatchedCaller = useCallback(
    (callerWallet: string): boolean => {
      if (!callerWallet) return false;
      const lower = callerWallet.toLowerCase();
      return watchedCallers.some((w) => w.toLowerCase() === lower);
    },
    [watchedCallers]
  );

  return {
    watchedTokens,
    watchedCallers,
    isLoaded,
    toggleWatchToken,
    isWatchedToken,
    isWatched,
    toggleWatchCaller,
    isWatchedCaller,
  };
}

export default useWatchlist;
