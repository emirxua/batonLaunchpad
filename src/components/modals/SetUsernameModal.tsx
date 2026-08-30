"use client";

import React, { useState, useEffect } from "react";
import { User, X, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";

interface SetUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onClaimUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
}

export function SetUsernameModal({
  isOpen,
  onClose,
  walletAddress,
  onClaimUsername,
}: SetUsernameModalProps) {
  const [handleInput, setHandleInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Real-time debounce check for username availability
  useEffect(() => {
    const clean = handleInput.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    const regex = /^[a-z0-9]{3,15}$/;
    if (!regex.test(clean)) {
      setIsAvailable(false);
      return;
    }

    let active = true;
    setIsChecking(true);

    const timer = setTimeout(() => {
      fetch(`/api/user/username?check=${encodeURIComponent(clean)}`)
        .then((res) => res.json())
        .then((data) => {
          if (active) {
            setIsAvailable(data.available);
          }
        })
        .catch(() => {
          if (active) setIsAvailable(null);
        })
        .finally(() => {
          if (active) setIsChecking(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [handleInput]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = handleInput.trim().toLowerCase();
    const regex = /^[a-z0-9]{3,15}$/;
    if (!regex.test(clean)) {
      setErrorMessage("Handle must be 3-15 characters, lowercase letters and numbers only. No symbols, dots, or dashes.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onClaimUsername(clean);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to claim handle.");
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || "Error registering username.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0D0E12] border border-amber-500/30 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden cursor-default"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
              <User className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-white uppercase tracking-wider">
                Claim Your Handle
              </h3>
              <span className="text-[10px] text-zinc-500 block">
                Connected Wallet: {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Choose Username</span>
              <span className="text-[10px] text-zinc-500 font-normal">
                Lowercase letters only (3-15 chars)
              </span>
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-amber-500">
                @
              </span>
              <input
                type="text"
                autoFocus
                value={handleInput}
                onChange={(e) => {
                  // Strict auto-sanitization: only lowercase letters and numbers
                  const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
                  setHandleInput(sanitized);
                  setErrorMessage(null);
                }}
                maxLength={15}
                placeholder="degenking"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl pl-9 pr-4 py-3 text-sm font-black text-zinc-950 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-zinc-600 font-mono"
              />
            </div>

            {/* Validation & Availability hints */}
            <div className="flex items-center justify-between text-[11px] px-1 font-mono">
              <span className="text-zinc-500">
                {handleInput.length}/15 chars (No dots &quot;.&quot; or dashes &quot;-&quot;)
              </span>

              {isChecking ? (
                <span className="text-amber-500 animate-pulse">Checking...</span>
              ) : isAvailable === true ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Available
                </span>
              ) : isAvailable === false && handleInput.length >= 3 ? (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Taken or invalid
                </span>
              ) : null}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || handleInput.length < 3 || isAvailable === false}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Claiming Handle...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Claim @{handleInput || "handle"} &amp; Continue</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetUsernameModal;
