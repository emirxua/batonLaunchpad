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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none font-mono">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg bg-[#0a0c10] border border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header Strip */}
        <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                  Instant Jupiter Swap
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> V6 Direct
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Swapping into <span className="text-amber-400 font-bold">${targetSymbol || "TOKEN"}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Swap Widget Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto max-h-[calc(92vh-75px)]">
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
