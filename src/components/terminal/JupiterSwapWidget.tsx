"use client";

import React, { useEffect, useRef, useState } from "react";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
  initialOutputMint?: string;
  targetSymbol?: string;
  className?: string;
}

declare global {
  interface Window {
    Jupiter?: {
      init: (config: Record<string, unknown>) => void;
      resume?: () => void;
    };
    _jupScriptLoaded?: boolean;
  }
}

const BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump";
const JUP_SCRIPT_URL = "https://terminal.jup.ag/main-v4.js";
const JUP_SCRIPT_ID = "jup-terminal-script-v4";

export function JupiterSwapWidget({
  outputMint,
  outputSymbol,
  initialOutputMint = BATON_MINT,
  targetSymbol = "BATON",
  className = "",
}: JupiterSwapWidgetProps) {
  const finalMint = outputMint || initialOutputMint;
  const finalSymbol = outputSymbol || targetSymbol;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function initJupiter() {
      if (cancelled) return;
      if (!window.Jupiter) {
        setError("Jupiter Terminal failed to load. Check your connection.");
        setLoading(false);
        return;
      }
      if (!containerRef.current) return;

      // Clear previous instance
      containerRef.current.innerHTML = "";
      setError(null);

      try {
        window.Jupiter.init({
          displayMode: "integrated",
          integratedTargetId: "jup-integrated-terminal",
          strictTokenList: false,
          defaultExplorer: "Solscan",
          formProps: {
            initialInputMint: "So11111111111111111111111111111111111111112", // Native SOL
            initialOutputMint: finalMint,
            fixedOutputMint: false,
          },
          enableWalletPassthrough: true,
        });
        setLoading(false);
      } catch (e) {
        console.error("Jupiter init error:", e);
        setError("Jupiter swap widget failed to initialize.");
        setLoading(false);
      }
    }

    function loadScript() {
      // Script already injected — just init
      if (window._jupScriptLoaded && window.Jupiter) {
        setTimeout(initJupiter, 50);
        return;
      }

      // Script tag already present but may still be loading
      const existing = document.getElementById(JUP_SCRIPT_ID);
      if (existing) {
        existing.addEventListener("load", () => {
          window._jupScriptLoaded = true;
          setTimeout(initJupiter, 100);
        });
        return;
      }

      // Inject script fresh
      const script = document.createElement("script");
      script.id = JUP_SCRIPT_ID;
      script.src = JUP_SCRIPT_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        if (cancelled) return;
        window._jupScriptLoaded = true;
        setTimeout(initJupiter, 150);
      };
      script.onerror = () => {
        if (cancelled) return;
        setError("Could not load Jupiter Terminal script.");
        setLoading(false);
      };
      document.body.appendChild(script);
    }

    setLoading(true);
    loadScript();

    return () => {
      cancelled = true;
    };
  }, [finalMint]);

  return (
    <div
      className={`w-full bg-zinc-950 rounded-xl border border-white/10 flex flex-col overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/40 shrink-0">
        <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
          ⚡ JUPITER ROUTE: ${finalSymbol}
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          Non-Custodial DEX · Powered by Jupiter
        </span>
      </div>

      {/* Widget Container */}
      <div className="flex-1 w-full relative min-h-[520px]">
        {/* Loading State */}
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-zinc-950">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-zinc-400">
              Loading Jupiter Swap…
            </span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-zinc-950 px-6 text-center">
            <span className="text-2xl">⚠️</span>
            <p className="text-xs font-mono text-rose-400">{error}</p>
            <a
              href={`https://jup.ag/swap/SOL-${finalMint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors mt-2"
            >
              Open Jupiter.ag →
            </a>
          </div>
        )}

        <div
          id="jup-integrated-terminal"
          ref={containerRef}
          className="w-full h-full min-h-[520px]"
        />
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
