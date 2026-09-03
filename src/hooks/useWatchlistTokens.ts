"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWallet } from "@solana/wallet-adapter-react";

// Module-level cache so state is shared instantly across all components without delay
let sharedWatchlist: string[] = (() => {
  if (typeof window !== "undefined") {
    try {
      const rawUser = localStorage.getItem("outbid_google_user");
      if (rawUser) {
        const last = localStorage.getItem("baton_user_watchlist_last");
        if (last) {
          const parsed = JSON.parse(last);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {}
  }
  return [];
})();

const listeners = new Set<(list: string[]) => void>();

function notifyListeners(newList: string[]) {
  sharedWatchlist = newList;
  listeners.forEach((fn) => fn(newList));
}

export function useWatchlistTokens() {
  const { user } = useUserProfile();
  const { connected, publicKey } = useWallet();
  const [watchlist, setWatchlist] = useState<string[]>(sharedWatchlist);
  const [authRequiredToast, setAuthRequiredToast] = useState(false);

  // Helper to synchronously determine the active user account identifier
  const getActiveUserIdentifier = useCallback((): string | null => {
    if (connected && publicKey && publicKey.toBase58().length > 20) {
      return publicKey.toBase58();
    }
    if (user?.email && user.email.includes("@")) return user.email;
    if (user?.wallet && user.wallet.length > 20) return user.wallet;
    if (user?.username && user.username.length >= 2) return user.username;
    if (user?.id && user.id.length > 2) return user.id;

    // Direct synchronous fallback from localStorage
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("outbid_google_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.email && parsed.email.includes("@")) return parsed.email;
          if (parsed?.wallet && parsed.wallet.length > 20) return parsed.wallet;
          if (parsed?.username && parsed.username.length >= 2) return parsed.username;
          if (parsed?.id && parsed.id.length > 2) return parsed.id;
        }
      } catch {}
    }
    return null;
  }, [connected, publicKey, user]);

  const activeId = getActiveUserIdentifier();
  const isLoggedIn = Boolean(activeId);

  // Subscribe to module-level shared watchlist updates
  useEffect(() => {
    const handleUpdate = (newList: string[]) => {
      setWatchlist(newList);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  // Fetch user watchlist from Database once on account login/change
  useEffect(() => {
    if (!activeId) return;

    const storageKey = `baton_user_watchlist_${activeId.toLowerCase()}`;

    // 1. Instant local restore (0ms)
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem("baton_user_watchlist_last");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          notifyListeners(parsed);
        }
      }
    } catch {}

    // 2. Fetch from Database and update
    fetch(`/api/user/watchlist?identifier=${encodeURIComponent(activeId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.watchlist)) {
          notifyListeners(data.watchlist);
          try {
            localStorage.setItem(storageKey, JSON.stringify(data.watchlist));
            localStorage.setItem("baton_user_watchlist_last", JSON.stringify(data.watchlist));
          } catch {}
        }
      })
      .catch(() => {});
  }, [activeId]);

  // Listen for user login/logout events to instantly restore or clear watchlist
  useEffect(() => {
    const handleUserUpdate = (e: any) => {
      if (e?.detail === null) {
        // Explicit logout
        notifyListeners([]);
        try {
          localStorage.removeItem("baton_user_watchlist_last");
        } catch {}
      } else if (e?.detail) {
        // User logged in!
        const u = e.detail;
        const id = u.email || u.wallet || u.username || u.id;
        if (id) {
          // Instant local restore
          try {
            const saved = localStorage.getItem(`baton_user_watchlist_${id.toLowerCase()}`) || localStorage.getItem("baton_user_watchlist_last");
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                notifyListeners(parsed);
              }
            }
          } catch {}

          // Fetch fresh from Turso DB
          fetch(`/api/user/watchlist?identifier=${encodeURIComponent(id)}`)
            .then((r) => r.json())
            .then((data) => {
              if (data?.success && Array.isArray(data.watchlist)) {
                notifyListeners(data.watchlist);
                try {
                  localStorage.setItem(`baton_user_watchlist_${id.toLowerCase()}`, JSON.stringify(data.watchlist));
                  localStorage.setItem("baton_user_watchlist_last", JSON.stringify(data.watchlist));
                } catch {}
              }
            })
            .catch(() => {});
        }
      }
    };
    window.addEventListener("outbid:user-updated", handleUserUpdate);
    return () => window.removeEventListener("outbid:user-updated", handleUserUpdate);
  }, []);

  // Toggle token in watchlist - 0ms INSTANT & DETERMINISTIC
  const toggleWatchlist = useCallback(
    (mint: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!mint) return false;

      const currentId = getActiveUserIdentifier();

      // If user is NOT logged in:
      if (!currentId) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("outbid:open-auth-modal"));
        }
        setAuthRequiredToast(true);
        setTimeout(() => setAuthRequiredToast(false), 3500);
        return false;
      }

      // User IS logged in!
      setAuthRequiredToast(false);
      const normalized = mint.trim();
      const storageKey = `baton_user_watchlist_${currentId.toLowerCase()}`;

      // Check current list synchronously from sharedWatchlist
      const exists = sharedWatchlist.some((m) => m.toLowerCase() === normalized.toLowerCase());
      const action: "add" | "remove" = exists ? "remove" : "add";

      // 1. Compute EXACT updated list (Add only this 1 item, or Remove only this 1 item)
      const updatedList = exists
        ? sharedWatchlist.filter((m) => m.toLowerCase() !== normalized.toLowerCase())
        : [...sharedWatchlist, normalized];

      // 2. Instant 0ms synchronous UI update across all components!
      notifyListeners(updatedList);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedList));
        localStorage.setItem("baton_user_watchlist_last", JSON.stringify(updatedList));
      } catch {}

      // 3. Persist to Turso Database in background with explicit action
      fetch("/api/user/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: currentId,
          mint: normalized,
          action,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && Array.isArray(data.watchlist)) {
            notifyListeners(data.watchlist);
            try {
              localStorage.setItem(storageKey, JSON.stringify(data.watchlist));
              localStorage.setItem("baton_user_watchlist_last", JSON.stringify(data.watchlist));
            } catch {}
          }
        })
        .catch((err) => {
          console.error("[Watchlist] Turso DB sync error:", err);
        });

      return !exists;
    },
    [getActiveUserIdentifier]
  );

  const isInWatchlist = useCallback(
    (mint: string) => {
      if (!mint) return false;
      const lower = mint.trim().toLowerCase();
      return watchlist.some((m) => m.toLowerCase() === lower);
    },
    [watchlist]
  );

  return {
    watchlist,
    toggleWatchlist,
    isWatchlisted: isInWatchlist,
    isInWatchlist,
    isLoggedIn,
    authRequiredToast,
    dismissAuthToast: () => setAuthRequiredToast(false),
    closeAuthToast: () => setAuthRequiredToast(false),
  };
}

export default useWatchlistTokens;
