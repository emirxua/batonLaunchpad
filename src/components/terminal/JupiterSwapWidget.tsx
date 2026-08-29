"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, ArrowRightLeft, ShieldCheck, Zap } from "lucide-react";

declare global {
  interface Window {
    Jupiter?: {
      init: (props: Record<string, unknown>) => void;
      syncProps?: (props: Record<string, unknown>) => void;
      close?: () => void;
    };
  }
}

const DEFAULT_BATON_MINT =
  process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS ||
  "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

interface JupiterSwapWidgetProps {
  initialOutputMint?: string;
  targetSymbol?: string;
  className?: string;
}

export const JupiterSwapWidget: React.FC<JupiterSwapWidgetProps> = ({
  initialOutputMint = DEFAULT_BATON_MINT,
  targetSymbol = "BATON",
  className = "",
}) => {
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const containerId = "jupiter-integrated-terminal";
  const currentOutputMintRef = useRef<string>(initialOutputMint);

  // 1. Inject official Jupiter Terminal script once
  useEffect(() => {
    if (window.Jupiter) {
      setIsScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById("jupiter-terminal-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => setIsScriptLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "jupiter-terminal-script";
    script.src = "https://terminal.jup.ag/main-v3.js";
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.warn("Failed to load official Jupiter Terminal script.");
      setIsInitializing(false);
    };

    document.head.appendChild(script);
  }, []);

  // 2. Initialize or sync Jupiter widget whenever script is ready or outputMint changes
  useEffect(() => {
    if (!isScriptLoaded || typeof window === "undefined" || !window.Jupiter) {
      return;
    }

    const outputMint = initialOutputMint || DEFAULT_BATON_MINT;
    currentOutputMintRef.current = outputMint;

    const rpcEndpoint =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      "https://api.mainnet-beta.solana.com";

    const targetEl = document.getElementById(containerId);
    if (!targetEl) return;

    // Clear previous widget instance inside container to prevent duplicate nodes
    targetEl.innerHTML = "";
    setIsInitializing(true);

    try {
      window.Jupiter.init({
        displayMode: "integrated",
        integratedTargetId: containerId,
        endpoint: rpcEndpoint,
        formProps: {
          initialOutputMint: outputMint,
          fixedOutputMint: false,
        },
        palette: {
          background: "#09090b",
          primary: "#f59e0b",
        },
        containerStyles: {
          zIndex: 10,
          maxHeight: "560px",
          borderRadius: "16px",
        },
      });
      setIsInitializing(false);
    } catch (err) {
      console.warn("Jupiter init error:", err);
      setIsInitializing(false);
    }
  }, [isScriptLoaded, initialOutputMint]);

  return (
    <div
      className={`w-full bg-[#0D0E12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className}`}
    >
      {/* ── Widget Header ────────────────────────────────────────────── */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-zinc-950/70 font-mono">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.25)] shrink-0">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-archivo font-black text-sm text-white tracking-wide uppercase truncate">
                Swap ${targetSymbol}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime-400/10 border border-lime-400/30 text-lime-400 font-bold flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                Jupiter DEX
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 truncate">
              Direct on-chain routing &amp; lowest slippage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-zinc-500 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Non-Custodial</span>
        </div>
      </div>

      {/* ── Terminal Container ───────────────────────────────────────── */}
      <div className="relative min-h-[460px] flex items-center justify-center bg-zinc-950/40 p-2 sm:p-4">
        {/* Loading Spinner */}
        {(!isScriptLoaded || isInitializing) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 z-20 font-mono text-xs text-zinc-400">
            <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
            <span>Connecting to Jupiter DEX Routing…</span>
          </div>
        )}

        {/* Jupiter Target Mount Element */}
        <div
          id={containerId}
          className="w-full flex items-center justify-center min-h-[420px]"
        />
      </div>
    </div>
  );
};
