"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CalloutFeed } from "@/components/CalloutFeed";
import { BurnModal } from "@/components/BurnModal";
import { Coin } from "@/types/coin";
import { Radio, ExternalLink, Zap } from "lucide-react";

export default function CalloutsPage() {
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);

  // Synchronized target token for Quick Swap
  const [selectedSwapToken, setSelectedSwapToken] = useState<{
    mint: string;
    symbol: string;
    name?: string;
    imageUrl?: string;
  }>({
    mint: "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
    symbol: "BATON",
    name: "Baton Corporation Ltd",
    imageUrl: "/images/baton-logo.png",
  });

  const handleSelectToken = (ca: string, symbol: string, name?: string, imageUrl?: string) => {
    if (!ca) return;
    setSelectedSwapToken({
      mint: ca,
      symbol: symbol.toUpperCase(),
      name: name || symbol,
      imageUrl: imageUrl || (ca === "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump" ? "/images/baton-logo.png" : undefined),
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#08090C] text-zinc-900 dark:text-zinc-100 flex flex-col font-space select-none">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* ── Main Full-Width Live Callouts Feed ─ */}
        <div className="w-full space-y-4">
          <CalloutFeed onSelectToken={handleSelectToken} />
        </div>
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Burn Modal */}
      {isBurnModalOpen && selectedCoin && (
        <BurnModal
          coin={selectedCoin}
          isOpen={isBurnModalOpen}
          onClose={() => {
            setIsBurnModalOpen(false);
            setSelectedCoin(null);
          }}
        />
      )}
    </div>
  );
}
