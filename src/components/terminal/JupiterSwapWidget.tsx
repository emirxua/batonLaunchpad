"use client";

import React, { useEffect, useRef, useState } from "react";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
}

const BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump";
const JUP_SCRIPT_ID = "jupiter-terminal-script-v4";
const JUP_SCRIPT_URL = "https://terminal.jup.ag/main-v4.js";

export function JupiterSwapWidget({
  outputMint = BATON_MINT,
  outputSymbol = "BATON",
}: JupiterSwapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initJupiter = () => {
      if (
        (window as unknown as { Jupiter?: { init: (c: unknown) => void } })
          .Jupiter &&
        containerRef.current &&
        isMounted
      ) {
        try {
          containerRef.current.innerHTML = "";
          (
            window as unknown as { Jupiter: { init: (c: unknown) => void } }
          ).Jupiter.init({
            displayMode: "integrated",
            integratedTargetId: "integrated-terminal",
            strictTokenList: false,
            defaultExplorer: "Solscan",
            enableWalletPassthrough: true,
            formProps: {
              initialInputMint: "So11111111111111111111111111111111111111112", // Native SOL
              initialOutputMint: outputMint,
              fixedOutputMint: false,
            },
          });
        } catch (e) {
          console.error("Jupiter init failed, switching to iframe fallback:", e);
          if (isMounted) setUseIframeFallback(true);
        }
      }
    };

    let script = document.getElementById(JUP_SCRIPT_ID) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = JUP_SCRIPT_ID;
      script.src = JUP_SCRIPT_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        if (isMounted) setTimeout(initJupiter, 150);
      };
      script.onerror = () => {
        if (isMounted) setUseIframeFallback(true);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(initJupiter, 150);
    }

    // 3 saniye içinde DOM render olmazsa iframe fallback'e geç
    const timer = setTimeout(() => {
      if (
        containerRef.current &&
        containerRef.current.children.length === 0 &&
        isMounted
      ) {
        setUseIframeFallback(true);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [outputMint]);

  return (
    <div className="w-full bg-zinc-950 rounded-xl border border-white/10 flex flex-col h-[580px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/40 shrink-0">
        <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
          ⚡ JUPITER ROUTE: ${outputSymbol}
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          Non-Custodial DEX · Powered by Jupiter
        </span>
      </div>

      {/* Widget or Iframe Fallback */}
      <div className="flex-1 w-full p-2 flex items-center justify-center relative">
        {useIframeFallback ? (
          <iframe
            src={`https://jup.ag/swap/SOL-${outputMint}?theme=dark`}
            className="w-full h-full border-0 rounded-lg min-h-[500px]"
            title="Jupiter Swap"
            allow="clipboard-write"
          />
        ) : (
          <div
            id="integrated-terminal"
            ref={containerRef}
            className="w-full h-full min-h-[500px]"
          />
        )}
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
