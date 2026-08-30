"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CalloutFeed } from "@/components/CalloutFeed";
import { QuickSwapCard } from "@/components/home/QuickSwapCard";
import { SubmitCalloutModal } from "@/components/modals/SubmitCalloutModal";
import { BurnModal } from "@/components/BurnModal";
import { Coin } from "@/types/coin";
import { Radio, PlusCircle, ExternalLink, Zap } from "lucide-react";

export default function CalloutsPage() {
  const [isSubmitCalloutOpen, setIsSubmitCalloutOpen] = useState(false);
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
        {/* ── Compact Cyberpunk Callout Banner ─────────────────────────── */}
        <section className="relative rounded-2xl border border-rose-500/30 bg-gradient-to-r from-zinc-950 via-[#0e0f14] to-zinc-950 p-3.5 sm:p-4 lg:p-5 overflow-hidden shadow-xl font-mono">
          <div
            className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-rose-500/10 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                <span>SOLANA WHALE &amp; ALPHA CALLOUTS</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                VERIFIED ALPHA CALLOUTS &amp;{" "}
                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
                  MULTIPLIER SIGNALS
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-400 max-w-xl">
                Real-time on-chain momentum signals from top Solana degens. Click any callout card to instantly load the token into the Jupiter V6 Swap Engine.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsSubmitCalloutOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all uppercase tracking-wider cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-zinc-950" />
                <span>Post Callout</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Split Layout: Left 60% Live Callouts Feed, Right 40% Sticky Instant Swap ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Callouts Feed */}
          <div className="lg:col-span-7 space-y-4">
            <CalloutFeed onSelectToken={handleSelectToken} />
          </div>

          {/* Right Column (5 cols): Sticky Instant Jupiter Swap */}
          <div id="quick-swap-container" className="lg:col-span-5 lg:sticky lg:top-20 space-y-4 scroll-mt-24">
            <QuickSwapCard
              targetMint={selectedSwapToken.mint}
              targetSymbol={selectedSwapToken.symbol}
              targetName={selectedSwapToken.name}
              targetIconUrl={selectedSwapToken.imageUrl}
            />
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Post Callout Modal */}
      <SubmitCalloutModal
        isOpen={isSubmitCalloutOpen}
        onClose={() => setIsSubmitCalloutOpen(false)}
        onSubmitSuccess={() => {
          setIsSubmitCalloutOpen(false);
        }}
      />

      {/* 5. Burn Modal */}
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
