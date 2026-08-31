"use client";

import React, { useState, useEffect } from "react";
import { User, X, CheckCircle2, AlertCircle, Sparkles, Edit3, ShieldCheck } from "lucide-react";

interface SetUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  currentUsername?: string | null;
  isRequired?: boolean;
  onClaimUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
}

export function SetUsernameModal({
  isOpen,
  onClose,
  userEmail,
  currentUsername,
  isRequired = false,
  onClaimUsername,
}: SetUsernameModalProps) {
  const [handleInput, setHandleInput] = useState(currentUsername || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Sync initial input with existing handle on open
  useEffect(() => {
    if (isOpen) {
      setHandleInput(currentUsername || "");
      setErrorMessage(null);
      setIsAvailable(null);
    }
  }, [isOpen, currentUsername]);

  // Real-time debounce check for username availability in persistent Turso DB
  useEffect(() => {
    const clean = handleInput.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setIsAvailable(null);
      setIsChecking(false);
      return;
    }

    // If typing current owned handle, it's always available to the owner
    if (currentUsername && clean === currentUsername.toLowerCase()) {
      setIsAvailable(true);
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
      fetch(
        `/api/user/username?check=${encodeURIComponent(clean)}&email=${encodeURIComponent(
          userEmail || ""
        )}`
      )
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
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [handleInput, userEmail, currentUsername]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = handleInput.trim().toLowerCase();
    const regex = /^[a-z0-9]{3,15}$/;
    if (!regex.test(clean)) {
      setErrorMessage("Handle must be 3-15 characters, lowercase letters and numbers only. No symbols, spaces, dots, or dashes.");
      return;
    }

    if (isAvailable === false) {
      setErrorMessage(`Username "@${clean}" is already taken by another user.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onClaimUsername(clean);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to claim handle.");
        setIsAvailable(false);
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

  const isInvalidFormat = handleInput.length > 0 && !/^[a-z0-9]{1,15}$/.test(handleInput);
  const isEditing = Boolean(currentUsername);

  return (
    <div
      onClick={isRequired ? undefined : onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0D0E12] border border-amber-500/40 rounded-3xl w-full max-w-md p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
              {isEditing ? <Edit3 className="w-4 h-4 text-amber-500" /> : <User className="w-4 h-4 text-amber-500" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-zinc-950 dark:text-white uppercase tracking-wider">
                {isEditing ? `Edit Handle (@${currentUsername})` : "Claim Your Unique Handle"}
              </h3>
              <span className="text-[10px] text-zinc-500 block font-mono">
                Google Account: {userEmail || "Connected"}
              </span>
            </div>
          </div>
          {!isRequired && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isRequired && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Welcome! Choose your unique handle to finish setting up your Outbid account.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <span className="uppercase tracking-wider">{isEditing ? "UPDATE USERNAME" : "CHOOSE USERNAME"}</span>
              <span className="text-[10px] text-zinc-500 font-normal lowercase font-mono">
                lowercase letters &amp; numbers only (3-15 chars)
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-amber-500">
                @
              </span>
              <input
                type="text"
                autoFocus
                value={handleInput}
                onChange={(e) => {
                  const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "");
                  setHandleInput(sanitized);
                  setErrorMessage(null);
                }}
                maxLength={15}
                placeholder="batonwhale"
                className={`w-full bg-zinc-50 dark:bg-zinc-900 border rounded-2xl pl-9 pr-4 py-3 text-sm font-black text-zinc-950 dark:text-white outline-none transition-colors placeholder:text-zinc-600 font-mono lowercase ${
                  isAvailable === true
                    ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                    : isAvailable === false
                    ? "border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                    : "border-zinc-200 dark:border-white/10 focus:border-amber-500"
                }`}
              />
            </div>

            {/* Validation & Live Turso DB Availability Feedback */}
            <div className="flex items-center justify-between text-[11px] px-1 font-mono">
              <span className="text-zinc-500">
                {handleInput.length}/15 chars (lowercase only)
              </span>

              {isChecking ? (
                <span className="text-amber-500 animate-pulse font-bold">Checking Turso DB...</span>
              ) : isAvailable === true ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isEditing && handleInput === currentUsername ? "Current Handle" : "Available"}
                </span>
              ) : isAvailable === false && handleInput.length >= 3 ? (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Username already taken
                </span>
              ) : isInvalidFormat ? (
                <span className="text-rose-400 font-bold">Invalid format</span>
              ) : null}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || handleInput.length < 3 || isAvailable === false}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>Saving to Turso DB...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isEditing ? `UPDATE @${handleInput || "handle"}` : `CLAIM @${handleInput || "handle"} & CONTINUE`}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetUsernameModal;
