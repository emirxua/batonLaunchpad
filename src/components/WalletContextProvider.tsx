"use client";

import React, { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

export const DEFAULT_RPC = "https://solana-rpc.publicnode.com";

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
}) => {
  const endpoint = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
    if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) {
      return raw;
    }
    return DEFAULT_RPC;
  }, []);

  // Standard wallet auto-discovery handles Phantom, Solflare, Backpack, etc. natively
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: "wss://solana-rpc.publicnode.com",
      }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
