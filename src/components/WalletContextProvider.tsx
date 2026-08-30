"use client";

import React, { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

export const DEFAULT_RPC = "https://solana-rpc.publicnode.com";

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
}) => {
  const endpoint = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://")) && !raw.includes("ankr.com") && !raw.includes("api.mainnet-beta.solana.com")) {
      return raw;
    }
    return DEFAULT_RPC;
  }, []);

  // Standard wallet auto-discovery handles Phantom, Solflare, Backpack, etc. natively
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
