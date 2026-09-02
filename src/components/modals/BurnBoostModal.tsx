"use client";

import React from "react";
import { Coin } from "@/types/coin";
import { BoostAnyTokenModal } from "@/components/modals/BoostAnyTokenModal";

export interface BurnBoostModalProps {
  coin: Coin | null;
  isOpen: boolean;
  initialAmount?: number;
  onClose: () => void;
  onSuccess?: (coinId: string, burnedAmount: number) => void;
}

export const BurnBoostModal: React.FC<BurnBoostModalProps> = ({
  coin,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !coin) return null;

  return (
    <BoostAnyTokenModal
      isOpen={isOpen}
      onClose={onClose}
      initialToken={{
        mint: coin.mintAddress || (coin as any).ca || (coin as any).mint || "",
        name: coin.name,
        symbol: coin.ticker || (coin as any).symbol || "TOKEN",
        iconUrl: coin.imageUrl || (coin as any).iconUrl,
        priceUsd: (coin as any).priceUsd,
        marketCap: (coin as any).marketCap || (coin as any).mcap,
      }}
      onSuccess={(mint, burnedAmount) => {
        if (onSuccess) {
          onSuccess(mint, burnedAmount);
        }
      }}
    />
  );
};

export default BurnBoostModal;
