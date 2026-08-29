"use client";

import React, { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
}

export function JupiterSwapWidget({
  outputMint = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump",
  outputSymbol = "BATON",
}: JupiterSwapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const walletContext = useWallet();

  useEffect(() => {
    const scriptId = "jupiter-terminal-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const launchJupiter = () => {
      if (
        typeof window !== "undefined" &&
        (window as unknown as { Jupiter?: { init: (c: unknown) => void } })
          .Jupiter &&
        containerRef.current
      ) {
        try {
          // Önceki içeriği sıfırla
          containerRef.current.innerHTML = "";

          (
            window as unknown as { Jupiter: { init: (c: unknown) => void } }
          ).Jupiter.init({
            displayMode: "integrated",
            integratedTargetId: "integrated-terminal",
            endpoint: "https://api.mainnet-beta.solana.com", // Kritik: RPC bağlantısı zorunlu
            strictTokenList: false,
            defaultExplorer: "Solscan",
            enableWalletPassthrough: true,
            passthroughWalletContextState: walletContext,
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
          console.error("Jupiter load failed:", e);
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://terminal.jup.ag/main-v3.js";
      script.async = true;
      script.onload = () => {
        setTimeout(launchJupiter, 250);
      };
      document.head.appendChild(script);
    } else {
      setTimeout(launchJupiter, 250);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [outputMint, walletContext]);

  // Cüzdan senkronizasyonu
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as unknown as { Jupiter?: { syncProps?: (p: unknown) => void } })
        .Jupiter?.syncProps
    ) {
      (
        window as unknown as { Jupiter: { syncProps: (p: unknown) => void } }
      ).Jupiter.syncProps({
        passthroughWalletContextState: walletContext,
      });
    }
  }, [walletContext]);

  return (
    <div className="w-full bg-zinc-950 rounded-xl border border-white/10 flex flex-col overflow-hidden font-mono shadow-2xl">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-400 tracking-wide">
            JUPITER ROUTE: ${outputSymbol}
          </span>
        </div>
        <span className="text-[10px] text-zinc-400">
          Non-Custodial DEX
        </span>
      </div>

      {/* Yerleşik Terminal Kapsayıcısı */}
      <div className="w-full p-2 flex flex-col items-center justify-start min-h-[460px] bg-zinc-950">
        <div
          id="integrated-terminal"
          ref={containerRef}
          className="w-full h-full min-h-[440px] flex flex-col"
        />
      </div>
    </div>
  );
}

export default JupiterSwapWidget;
