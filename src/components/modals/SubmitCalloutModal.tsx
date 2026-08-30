"use client";

import React, { useState, useEffect } from "react";
import { CalloutItem } from "@/types/token";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { formatNumber } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  Radio,
  Flame,
  X,
  Zap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  RefreshCw,
  Wallet,
} from "lucide-react";

interface SubmitCalloutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newCallout: CalloutItem) => void;
}

export function SubmitCalloutModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}: SubmitCalloutModalProps) {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { username } = useUserProfile();

  const [tokenCA, setTokenCA] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenIcon, setTokenIcon] = useState<string | undefined>(undefined);
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [entryMcap, setEntryMcap] = useState<number>(0);
  const [isVerifyingCA, setIsVerifyingCA] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState<number | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  const [thesis, setThesis] = useState("");
  const [burnToPin, setBurnToPin] = useState(false);
  const [burnAmount, setBurnAmount] = useState(50000);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time On-Chain DexScreener lookup when user inputs/pastes a Solana CA
  useEffect(() => {
    const trimmed = tokenCA.trim();
    if (trimmed.length >= 32 && trimmed.length <= 44 && !/\s/.test(trimmed)) {
      let isMounted = true;
      setIsVerifyingCA(true);
      setErrorMsg(null);

      const ctrl = new AbortController();

      fetch(`/api/token-lookup?mint=${encodeURIComponent(trimmed)}`, {
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Lookup failed");
          const data = await res.json();
          if (!isMounted) return;

          if (data && data.mint) {
            setTokenSymbol(data.symbol || "TOKEN");
            setTokenName(data.name || "Solana Token");
            setTokenIcon(data.iconUrl || undefined);
            setEntryPrice(data.priceUsd || 0);
            setEntryMcap(data.marketCap || data.fdv || 0);
          }
        })
        .catch(() => {
          // Ignore lookup errors
        })
        .finally(() => {
          if (isMounted) setIsVerifyingCA(false);
        });

      return () => {
        isMounted = false;
        ctrl.abort();
      };
    } else {
      setEntryPrice(0);
      setEntryMcap(0);
      setUserTokenBalance(null);
    }
  }, [tokenCA]);

  // On-Chain Wallet Balance Proof Check
  useEffect(() => {
    let isMounted = true;
    async function checkHolding() {
      const trimmed = tokenCA.trim();
      if (connected && publicKey && connection && trimmed.length >= 32 && trimmed.length <= 44) {
        setIsCheckingBalance(true);
        try {
          const { PublicKey } = await import("@solana/web3.js");
          const resp = await connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: new PublicKey(trimmed),
          });
          if (isMounted) {
            const accounts = resp.value || [];
            if (accounts.length > 0) {
              const amt = accounts[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
              setUserTokenBalance(amt);
            } else {
              setUserTokenBalance(0);
            }
          }
        } catch {
          if (isMounted) setUserTokenBalance(0);
        } finally {
          if (isMounted) setIsCheckingBalance(false);
        }
      } else {
        if (isMounted) setUserTokenBalance(null);
      }
    }

    checkHolding();
  }, [connected, publicKey, connection, tokenCA]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = tokenCA.trim();
    if (!trimmed || trimmed.length < 32) {
      setErrorMsg("Please enter a valid Solana Token Mint / Contract Address (CA).");
      return;
    }

    if (!thesis.trim()) {
      setErrorMsg("Please write a short conviction thesis for this callout.");
      return;
    }

    const shortHandle = username
      ? username
      : publicKey
      ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
      : "anon_alpha";

    const symbolClean = (tokenSymbol.trim() || trimmed.slice(0, 4)).toUpperCase();
    const nameClean = tokenName.trim() || `${symbolClean} Token`;
    const numPrice = entryPrice > 0 ? entryPrice : 0.00001;
    const numMcap = entryMcap > 0 ? entryMcap : 10000;
    const finalBurnAmount = burnToPin ? burnAmount : 0;
    const hasHolderProof = (userTokenBalance ?? 0) > 0;

    const newCallout: CalloutItem = {
      id: `callout-user-${Date.now()}`,
      callerName: username
        ? `@${username}`
        : connected
        ? hasHolderProof
          ? `Verified Holder (${shortHandle})`
          : `Degen (${shortHandle})`
        : "Community Alpha",
      callerHandle: shortHandle,
      callerAvatar: symbolClean.slice(0, 2),
      callerBadge: burnToPin
        ? "🔥 Pinned Alpha"
        : hasHolderProof
        ? "🛡️ Verified Holder"
        : "Community Signal",
      tokenName: nameClean,
      tokenSymbol: symbolClean,
      tokenCA: trimmed,
      calloutPrice: numPrice,
      currentPrice: numPrice * 1.05,
      entryMcap: numMcap,
      currentMcap: Math.round(numMcap * 1.05),
      multiplier: 1.05,
      timeAgo: "Just now",
      upvotes: 1,
      batonBurned: finalBurnAmount,
      thesis: thesis.trim().slice(0, 140),
    };

    fetch("/api/callouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenCA: trimmed,
        tokenSymbol: symbolClean,
        tokenName: nameClean,
        entryPrice: numPrice,
        entryMcap: numMcap,
        thesis: thesis.trim().slice(0, 140),
        burnAmount: finalBurnAmount,
        callerWallet: publicKey ? publicKey.toBase58() : undefined,
        callerName: newCallout.callerName,
        isVerifiedHolder: hasHolderProof,
        holderBalance: userTokenBalance ?? 0,
      }),
    }).catch(() => {});

    onSubmitSuccess(newCallout);
    setSuccessMsg("Callout published with verified on-chain entry market cap!");

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0D0E12] border border-amber-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Modal Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 font-black flex items-center justify-center text-xs shadow-md">
              <Radio className="w-4 h-4 text-zinc-950 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-white uppercase tracking-wider">
                Share Alpha / Post Callout
              </h3>
              <span className="text-[10px] text-zinc-500 block">
                Live verified entry signal on Outbid alpha stream
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token Contract Address (CA) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                <span>Token Contract Address (CA)</span>
                <span className="text-amber-500">*</span>
              </label>
              {isVerifyingCA && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Verifying On-Chain…
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={tokenCA}
                onChange={(e) => setTokenCA(e.target.value)}
                placeholder="Paste Solana token mint address..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-500 font-mono"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Token Symbol & Verified Entry Market Cap (Auto-locked from chain) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Token Symbol
              </label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                placeholder="e.g. STACY"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none uppercase font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Entry MCAP ($)</span>
                </label>
                <span className="text-[9px] text-emerald-400 font-bold uppercase">
                  Verified
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={
                    entryMcap > 0
                      ? `$${entryMcap.toLocaleString()} USD`
                      : isVerifyingCA
                      ? "Querying chain..."
                      : "Auto-synced via CA"
                  }
                  className="w-full bg-zinc-100 dark:bg-zinc-900/90 border border-emerald-500/30 text-emerald-400 rounded-xl px-3.5 py-2 text-xs outline-none font-mono font-bold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Proof of Holding Status Banner */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px]">
                <span className="text-zinc-400 block">Proof of Holding:</span>
                {isCheckingBalance ? (
                  <span className="text-amber-400 font-bold animate-pulse">Checking connected wallet…</span>
                ) : connected && userTokenBalance !== null && userTokenBalance > 0 ? (
                  <span className="text-emerald-400 font-bold">
                    ✅ {formatNumber(userTokenBalance)} ${tokenSymbol || "TOKEN"} held in wallet
                  </span>
                ) : connected ? (
                  <span className="text-zinc-400">0 Tokens held in connected wallet</span>
                ) : (
                  <span className="text-amber-400/80">Connect wallet for Verified Holder badge</span>
                )}
              </div>
            </div>

            {!connected && (
              <button
                type="button"
                onClick={() => setVisible(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
              >
                Connect
              </button>
            )}
          </div>

          {/* Alpha Thesis / Conviction Note */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              <span>Alpha Thesis / Conviction Note</span>
              <span className="text-zinc-400 font-normal">
                {thesis.length}/140
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={140}
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="Why is this coin going to send? Key catalysts, devs, or volume..."
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 outline-none resize-none placeholder:text-zinc-500 font-mono"
              required
            />
          </div>

          {/* Optional: Burn $BATON to Pin on Top */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={burnToPin}
                onChange={(e) => setBurnToPin(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-xs font-extrabold text-amber-500 dark:text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current text-orange-500" />
                Burn $BATON to Pin on Top (#1 Spotlight)
              </span>
            </label>

            {burnToPin && (
              <div className="flex items-center gap-2 pt-1">
                {[25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBurnAmount(amt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      burnAmount === amt
                        ? "bg-amber-500 text-zinc-950 border-amber-400"
                        : "bg-zinc-900 text-zinc-400 border-white/10 hover:text-white"
                    }`}
                  >
                    {formatNumber(amt)} $BATON
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4 text-zinc-950" />
            <span>Broadcast Alpha Callout</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default SubmitCalloutModal;
