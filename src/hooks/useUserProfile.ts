"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export interface UserProfileData {
  id: string;
  googleId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  wallet?: string;
  username: string | null;
  registeredAt?: number;
}

const STORAGE_KEY = "outbid_google_user";

export function useUserProfile() {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const { publicKey, connected } = useWallet();

  // Initialize from localStorage and sync with Turso DB
  useEffect(() => {
    let isMounted = true;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed: UserProfileData = JSON.parse(cached);
        if (parsed && (parsed.email || parsed.id || parsed.wallet)) {
          setUser(parsed);

          if (!parsed.username || parsed.username.length < 3) {
            setIsUsernameModalOpen(true);
          }

          // Sync with Turso Cloud DB in background
          const queryParam = parsed.email
            ? `email=${encodeURIComponent(parsed.email)}`
            : parsed.wallet
            ? `wallet=${encodeURIComponent(parsed.wallet)}`
            : `userId=${encodeURIComponent(parsed.id)}`;

          fetch(`/api/user/username?${queryParam}`)
            .then((res) => res.json())
            .then((data) => {
              if (!isMounted) return;
              if (data && data.user) {
                const freshUser: UserProfileData = {
                  id: data.user.id,
                  googleId: data.user.googleId,
                  email: data.user.email,
                  name: data.user.name || parsed.name,
                  avatarUrl: data.user.avatarUrl || parsed.avatarUrl,
                  wallet: data.user.wallet || parsed.wallet,
                  username: data.user.username || null,
                  registeredAt: data.user.registeredAt,
                };
                setUser(freshUser);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
                if (!freshUser.username || freshUser.username.length < 3) {
                  setIsUsernameModalOpen(true);
                }
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      // Ignore parse error
    } finally {
      if (isMounted) setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-link connected Solana wallet to user account in Turso DB
  useEffect(() => {
    if (!connected || !publicKey || !user) return;

    const walletStr = publicKey.toBase58();
    if (user.wallet === walletStr) return;

    // Send wallet linking request to Turso DB
    const identifier = user.id || user.email;
    if (!identifier) return;

    fetch("/api/user/link-wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        wallet: walletStr,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const updatedUser: UserProfileData = {
            ...user,
            wallet: walletStr,
          };
          setUser(updatedUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        }
      })
      .catch((err) => console.warn("[UserProfile] Wallet link sync error:", err));
  }, [connected, publicKey, user]);

  // Google Login action
  const loginWithGoogle = useCallback(
    async (data: { email: string; name?: string; avatarUrl?: string; sub?: string; credential?: string }) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data.credential ? { credential: data.credential } : { user: data }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Google authentication failed");
        }

        const authenticatedUser: UserProfileData = {
          id: json.user.id,
          googleId: json.user.googleId,
          email: json.user.email,
          name: json.user.name,
          avatarUrl: json.user.avatarUrl,
          wallet: json.user.wallet,
          username: json.user.username || null,
          registeredAt: json.user.registeredAt,
        };

        setUser(authenticatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser));
        setIsAuthModalOpen(false);

        // If username not set yet, trigger username claim modal
        if (json.needsUsername || !authenticatedUser.username) {
          setIsUsernameModalOpen(true);
        } else {
          setIsUsernameModalOpen(false);
        }

        return { success: true, user: authenticatedUser };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Logout action
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setIsUsernameModalOpen(false);
    setIsAuthModalOpen(false);
  }, []);

  // Claim or Edit unique username in Turso DB
  const claimUsername = useCallback(
    async (newUsername: string): Promise<{ success: boolean; error?: string }> => {
      const activeIdentifier = user?.id || user?.email || (publicKey ? publicKey.toBase58() : null);
      if (!activeIdentifier) {
        return { success: false, error: "Please sign in with Google or connect wallet first." };
      }

      const clean = newUsername.trim().toLowerCase();
      const validRegex = /^[a-z0-9]{3,15}$/;
      if (!validRegex.test(clean)) {
        return {
          success: false,
          error: "Username must be 3-15 characters, lowercase english letters and numbers only. No spaces, symbols, dots, or dashes.",
        };
      }

      try {
        const res = await fetch("/api/user/username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id,
            email: user?.email,
            wallet: user?.wallet || (publicKey ? publicKey.toBase58() : undefined),
            username: clean,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || "Failed to claim handle" };
        }

        const updatedUser: UserProfileData = {
          id: data.user?.id || user?.id || `usr_${clean}`,
          googleId: data.user?.googleId || user?.googleId,
          email: data.user?.email || user?.email,
          name: data.user?.name || user?.name,
          avatarUrl: data.user?.avatarUrl || user?.avatarUrl,
          wallet: data.user?.wallet || user?.wallet || (publicKey ? publicKey.toBase58() : undefined),
          username: clean,
          registeredAt: data.user?.registeredAt || Date.now(),
        };

        setUser(updatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        setIsUsernameModalOpen(false);
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: msg || "Failed to register username." };
      }
    },
    [user, publicKey]
  );

  const isLoggedIn = Boolean(user && (user.email || user.id));
  const needsUsername = Boolean(isLoggedIn && (!user?.username || user.username.length < 3));

  return {
    user,
    username: user?.username || null,
    email: user?.email || null,
    wallet: user?.wallet || (publicKey ? publicKey.toBase58() : null),
    isLoggedIn,
    needsUsername,
    isLoading,
    isUsernameModalOpen,
    isAuthModalOpen,
    openAuthModal: () => setIsAuthModalOpen(true),
    closeAuthModal: () => setIsAuthModalOpen(false),
    openGoogleLoginModal: () => setIsAuthModalOpen(true),
    closeGoogleLoginModal: () => setIsAuthModalOpen(false),
    openUsernameModal: () => setIsUsernameModalOpen(true),
    closeUsernameModal: () => {
      if (!needsUsername) {
        setIsUsernameModalOpen(false);
      }
    },
    loginWithGoogle,
    logout,
    claimUsername,
  };
}

export default useUserProfile;
