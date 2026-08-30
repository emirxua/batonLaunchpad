"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export function useUserProfile() {
  const { connected, publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() || "";

  const [username, setUsernameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasPrompted, setHasPrompted] = useState<boolean>(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState<boolean>(false);

  // Fetch username whenever wallet changes
  useEffect(() => {
    if (!connected || !walletAddress) {
      setUsernameState(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    // 1. Check localStorage first for instant hydration
    const cached = localStorage.getItem(`outbid_handle_${walletAddress}`);
    if (cached) {
      setUsernameState(cached);
    }

    // 2. Sync with API
    fetch(`/api/user/username?wallet=${encodeURIComponent(walletAddress)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.username) {
          setUsernameState(data.username);
          localStorage.setItem(`outbid_handle_${walletAddress}`, data.username);
          setIsUsernameModalOpen(false);
        } else if (!cached && !hasPrompted) {
          // Connected wallet has no username set yet
          setIsUsernameModalOpen(true);
          setHasPrompted(true);
        }
      })
      .catch((err) => console.warn("Failed to fetch username:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [connected, walletAddress, hasPrompted]);

  const claimUsername = useCallback(
    async (newUsername: string): Promise<{ success: boolean; error?: string }> => {
      if (!connected || !walletAddress) {
        return { success: false, error: "Please connect your Solana wallet first." };
      }

      const clean = newUsername.trim().toLowerCase();
      const validRegex = /^[a-z0-9]{3,15}$/;
      if (!validRegex.test(clean)) {
        return {
          success: false,
          error: "Username must be 3-15 characters, lowercase letters and numbers only. No symbols, dots, or dashes.",
        };
      }

      try {
        const res = await fetch("/api/user/username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: walletAddress,
            username: clean,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || "Failed to claim handle" };
        }

        setUsernameState(clean);
        localStorage.setItem(`outbid_handle_${walletAddress}`, clean);
        setIsUsernameModalOpen(false);
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: msg || "Failed to register username." };
      }
    },
    [connected, walletAddress]
  );

  return {
    username,
    walletAddress,
    isLoading,
    isUsernameModalOpen,
    openUsernameModal: () => setIsUsernameModalOpen(true),
    closeUsernameModal: () => setIsUsernameModalOpen(false),
    claimUsername,
  };
}
