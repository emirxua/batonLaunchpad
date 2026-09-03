"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  X,
  Wallet,
  ArrowRight,
  Loader2,
  AlertCircle,
  LogIn,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSuccess: (userData: {
    email: string;
    name?: string;
    avatarUrl?: string;
    sub?: string;
  }) => Promise<any>;
}

// Decode Google JWT Credential helper
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthModal({ isOpen, onClose, onGoogleSuccess }: AuthModalProps) {
  const { setVisible: openWalletModal } = useWalletModal();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "542093400852-a96ka3turl2be538vco4efves7o5vg22.apps.googleusercontent.com";

  // Listen for popup postMessage events from /auth/callback
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        const { idToken, accessToken } = event.data;
        try {
          setIsLoadingGoogle(true);
          if (idToken) {
            const payload = parseJwt(idToken);
            if (payload?.email) {
              await onGoogleSuccess({
                email: payload.email,
                name: payload.name || payload.given_name || payload.email.split("@")[0],
                avatarUrl: payload.picture,
                sub: payload.sub,
              });
              onClose();
              return;
            }
          }

          if (accessToken) {
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok) {
              const userProfile = await res.json();
              await onGoogleSuccess({
                email: userProfile.email,
                name: userProfile.name || userProfile.given_name || userProfile.email.split("@")[0],
                avatarUrl: userProfile.picture,
                sub: userProfile.sub,
              });
              onClose();
              return;
            }
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMessage(msg || "Failed to process Google sign in.");
        } finally {
          setIsLoadingGoogle(false);
        }
      } else if (event.data?.type === "GOOGLE_AUTH_ERROR") {
        setErrorMessage("Google Sign In was cancelled.");
        setIsLoadingGoogle(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onGoogleSuccess, onClose]);

  // Clean, fast Google Popup Launch
  const handleLaunchGoogle = () => {
    setErrorMessage(null);
    setIsLoadingGoogle(true);

    if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
      try {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: async (tokenResponse: { access_token?: string; error?: string }) => {
            if (tokenResponse.error || !tokenResponse.access_token) {
              setIsLoadingGoogle(false);
              setErrorMessage("Google Sign In was cancelled.");
              return;
            }

            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              if (!res.ok) throw new Error("Could not fetch user profile");
              const userProfile = await res.json();

              await onGoogleSuccess({
                email: userProfile.email,
                name: userProfile.name || userProfile.given_name || userProfile.email.split("@")[0],
                avatarUrl: userProfile.picture,
                sub: userProfile.sub,
              });
              onClose();
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              setErrorMessage(msg || "Error processing Google authentication.");
            } finally {
              setIsLoadingGoogle(false);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: "select_account" });
        return;
      } catch {
        // Fallback to standard window.open
      }
    }

    // Standard OAuth2 Popup
    const redirectUri = `${window.location.origin}/auth/callback`;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token%20id_token&scope=openid%20email%20profile&nonce=outbid_${Date.now()}`;

    const width = 500;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      oauthUrl,
      "GoogleSignIn",
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (!popup) {
      setIsLoadingGoogle(false);
      setErrorMessage("Popup was blocked by your browser. Please allow popups.");
    }
  };

  const handleWalletConnect = () => {
    onClose();
    openWalletModal(true);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0D0E12] border border-amber-500/30 rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden cursor-default animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden -mt-1 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700/80" />
        </div>

        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-zinc-950 dark:text-white uppercase tracking-wider">
                Sign In
              </h3>
              <span className="text-[10px] text-zinc-500 block">
                Connect to Outbid Terminal
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sign In Options */}
        <div className="space-y-3">
          {/* 1. Google Button */}
          <button
            type="button"
            onClick={handleLaunchGoogle}
            disabled={isLoadingGoogle}
            className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-950 dark:text-white font-black text-xs tracking-wider shadow-sm transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-98 border border-zinc-200 dark:border-white/10 disabled:opacity-50 group"
          >
            <div className="flex items-center gap-3">
              {isLoadingGoogle ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="font-bold">Continue with Google</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
          </button>

          {/* 2. Solana Wallet Button */}
          <button
            type="button"
            onClick={handleWalletConnect}
            className="w-full py-3 px-4 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-black text-xs tracking-wider border border-purple-500/30 transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-98 group"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-bold">Connect Solana Wallet</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 3. Direct Email Sign-In (Guaranteed 100% uptime on any domain) */}
          <div className="pt-2 border-t border-zinc-200 dark:border-white/10 space-y-2">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold text-center">
              or sign in with email
            </span>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.elements.namedItem("email") as HTMLInputElement;
                const emailVal = emailInput?.value?.trim().toLowerCase();
                if (!emailVal || !emailVal.includes("@")) {
                  setErrorMessage("Please enter a valid email address.");
                  return;
                }
                try {
                  setIsLoadingGoogle(true);
                  setErrorMessage(null);
                  await onGoogleSuccess({
                    email: emailVal,
                    name: emailVal.split("@")[0],
                    sub: `email_${emailVal.replace(/[^a-zA-Z0-9]/g, "_")}`,
                  });
                  onClose();
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : "Authentication failed";
                  setErrorMessage(msg);
                } finally {
                  setIsLoadingGoogle(false);
                }
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="email"
                name="email"
                placeholder="name@gmail.com"
                required
                className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 font-mono"
              />
              <button
                type="submit"
                disabled={isLoadingGoogle}
                className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sign In"}
              </button>
            </form>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
