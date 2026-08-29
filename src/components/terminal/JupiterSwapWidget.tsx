"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Zap } from "lucide-react";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
}

export function JupiterSwapWidget({
  outputMint = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
  outputSymbol = "BATON",
}: JupiterSwapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const walletContextState = useWallet();
  const { wallet } = walletContextState;
  const [useIframeFallback, setUseIframeFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const scriptId = "jupiter-terminal-script";

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
            passthroughWalletContextState: walletContextState,
            formProps: {
              initialInputMint: "So11111111111111111111111111111111111111112", // Native SOL
              initialOutputMint: outputMint,
              initialAmount: "0.1",
              fixedOutputMint: false,
            },
            palette: {
              background: "#09090b",
              primary: "#f59e0b",
            },
          });
        } catch (e) {
          console.error("Jupiter script init failed:", e);
          if (isMounted) setUseIframeFallback(true);
        }
      }
    };

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://terminal.jup.ag/main-v3.js";
      script.async = true;
      script.onload = () => setTimeout(initJupiter, 100);
      script.onerror = () => {
        if (isMounted) setUseIframeFallback(true);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(initJupiter, 100);
    }

    return () => {
      isMounted = false;
    };
  }, [outputMint, walletContextState]);

  // Cüzdan bağlama context senkronizasyonu
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as unknown as { Jupiter?: { syncProps?: (p: unknown) => void } })
        .Jupiter?.syncProps
    ) {
      (
        window as unknown as { Jupiter: { syncProps: (p: unknown) => void } }
      ).Jupiter.syncProps({
        passthroughWalletContextState: walletContextState,
      });
    }
  }, [wallet, walletContextState]);

  return (
    <div className="w-full bg-zinc-950 rounded-xl border border-white/10 flex flex-col h-auto overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/40">
        <span className="font-mono text-xs font-bold text-amber-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>JUPITER ROUTE: ${outputSymbol}</span>
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          Non-Custodial DEX · Powered by Jupiter
        </span>
      </div>

      {/* Widget Container - Fazlalık alt boşluk sıfırlandı */}
      <div className="w-full p-3 flex flex-col justify-start items-center">
        {useIframeFallback ? (
          <iframe
            src={`https://jup.ag/swap/SOL-${outputMint}?theme=dark`}
            className="w-full h-[390px] border-0 rounded-lg"
            title="Jupiter Swap"
          />
        ) : (
          <div
            id="integrated-terminal"
            ref={containerRef}
            className="w-full h-auto min-h-[360px] flex flex-col"
          />
        )}
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
