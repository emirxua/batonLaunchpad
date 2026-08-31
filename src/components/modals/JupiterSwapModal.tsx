"use client";

import React, { useEffect } from "react";
import { X, Zap, ShieldCheck } from "lucide-react";
import { JupiterSwapWidget } from "@/components/terminal/JupiterSwapWidget";

interface JupiterSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMint?: string;
  targetSymbol?: string;
  targetName?: string;
  targetIconUrl?: string;
}

export function JupiterSwapModal({
  isOpen,
  onClose,
  targetMint,
  targetSymbol,
  targetName,
  targetIconUrl,
}: JupiterSwapModalProps) {
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

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none font-mono cursor-pointer"
    >
      {/* Modal / Mobile Bottom Sheet Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg bg-[#0B0D13] border border-amber-500/30 sm:rounded-3xl rounded-t-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[92dvh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 cursor-default"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1 rounded-full bg-zinc-700/80" />
        </div>

        {/* Minimal Header Strip */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200/10 dark:border-white/10 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 overflow-hidden">
              {targetIconUrl ? (
                <img src={targetIconUrl} alt={targetSymbol || "Token"} className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-4 h-4 fill-current" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight truncate">
                  ${targetSymbol || "TOKEN"} SWAP
                </h3>
                <span className="text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0">
                  Jupiter V6
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 truncate">
                {targetName || `Swap SOL for $${targetSymbol || "TOKEN"}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Swap Widget Content Body */}
        <div className="p-3 sm:p-5 overflow-y-auto max-h-[calc(92dvh-65px)] pb-[max(env(safe-area-inset-bottom,16px),16px)]">
          <JupiterSwapWidget
            targetMint={targetMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump"}
            targetSymbol={targetSymbol || "BATON"}
            targetIconUrl={targetIconUrl}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
}

export default JupiterSwapModal;
