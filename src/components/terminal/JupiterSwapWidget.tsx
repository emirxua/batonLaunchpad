"use client";

import React, { useEffect, useState, useRef } from "react";
import { ArrowRightLeft, ShieldCheck, Zap, RefreshCw } from "lucide-react";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
  initialOutputMint?: string;
  targetSymbol?: string;
  className?: string;
}

const DEFAULT_BATON_MINT =
  process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS ||
  "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump";

export function JupiterSwapWidget({
  outputMint,
  outputSymbol,
  initialOutputMint = DEFAULT_BATON_MINT,
  targetSymbol = "BATON",
  className = "",
}: JupiterSwapWidgetProps) {
  const finalMint = outputMint || initialOutputMint;
  const finalSymbol = outputSymbol || targetSymbol;

  const [useIframe, setUseIframe] = useState<boolean>(false);
  const isTerminalRenderedRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset state for new token
    isTerminalRenderedRef.current = false;

    const scriptId = "jupiter-terminal-script";

    const launchJupiter = () => {
      if (
        typeof window !== "undefined" &&
        (window as unknown as { Jupiter?: { init: (props: unknown) => void } }).Jupiter
      ) {
        try {
          const container = document.getElementById("integrated-terminal");
          if (container) {
            container.innerHTML = "";
          }

          (window as unknown as { Jupiter: { init: (props: unknown) => void } }).Jupiter.init({
            displayMode: "integrated",
            integratedTargetId: "integrated-terminal",
            endpoint: "https://rpc.ankr.com/solana",
            strictTokenList: false,
            formProps: {
              fixedInputMint: false,
              fixedOutputMint: false,
              initialInputMint: "So11111111111111111111111111111111111111112", // Native SOL
              initialOutputMint: finalMint,
              initialAmount: "0.1",
            },
            palette: {
              background: "#09090b",
              primary: "#f59e0b",
            },
          });

          isTerminalRenderedRef.current = true;
        } catch (e) {
          console.warn("Jupiter script init warning, activating iframe fallback:", e);
          setUseIframe(true);
        }
      }
    };

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://terminal.jup.ag/main-v3.js";
      script.async = true;
      script.onload = () => {
        setTimeout(launchJupiter, 200);
      };
      script.onerror = () => {
        console.warn("Failed to load Jupiter script, falling back to iframe.");
        setUseIframe(true);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(launchJupiter, 200);
    }

    // 2-second fallback watchdog: if script didn't mount elements, switch to iframe
    const fallbackTimer = setTimeout(() => {
      const container = document.getElementById("integrated-terminal");
      if (!container || container.children.length === 0) {
        setUseIframe(true);
      }
    }, 2000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [finalMint]);

  return (
    <div
      className={`w-full bg-zinc-950/90 rounded-xl border border-white/10 flex flex-col h-[580px] overflow-hidden shadow-2xl ${className}`}
    >
      {/* Widget Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/60 font-mono">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
              ⚡ JUPITER ROUTE: ${finalSymbol}
            </span>
            <div className="text-[10px] text-zinc-400">
              {useIframe ? "Direct DEX Engine" : "Integrated Terminal"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUseIframe((prev) => !prev)}
            className="p-1 hover:text-orange-400 text-zinc-500 transition-colors"
            title="Toggle Engine Mode"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Non-Custodial</span>
          </span>
        </div>
      </div>

      {/* Widget Swap Body: Iframe Fallback or Integrated Script */}
      <div className="flex-1 w-full p-2 flex items-center justify-center relative">
        {useIframe ? (
          <iframe
            src={`https://jup.ag/swap/SOL-${finalMint}?theme=dark`}
            title="Jupiter Swap Engine"
            className="w-full h-full border-0 rounded-lg min-h-[500px]"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div id="integrated-terminal" className="w-full h-full min-h-[500px]" />
        )}
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
