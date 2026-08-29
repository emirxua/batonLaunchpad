"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HomeStatsBar } from "@/components/home/HomeStatsBar";
import { LiveCalloutsFeed } from "@/components/home/LiveCalloutsFeed";
import { KingOfHillCard } from "@/components/home/KingOfHillCard";
import { RankedAttentionTable } from "@/components/home/RankedAttentionTable";
import { QuickSwapCard } from "@/components/home/QuickSwapCard";
import { LiveSignalsCompact } from "@/components/home/LiveSignalsCompact";
import { OutbidModal } from "@/components/modals/OutbidModal";
import { useHomeData } from "@/hooks/useHomeData";
import { Coin } from "@/types/coin";

export default function OutbidHomePage() {
  const {
    coins,
    top1Coin,
    rankedCoins,
    totalBurned,
    activeRooms,
    totalVolume24h,
    recentCallouts,
    isLoading,
    refresh,
  } = useHomeData();

  const [selectedCoinForOutbid, setSelectedCoinForOutbid] = useState<Coin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenOutbid = (coin?: Coin | null) => {
    setSelectedCoinForOutbid(coin || top1Coin || coins[0] || null);
    setIsModalOpen(true);
  };

  const handleCloseOutbid = () => {
    setIsModalOpen(false);
    setSelectedCoinForOutbid(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090C] text-zinc-200 selection:bg-amber-500 selection:text-black font-space">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Top Live Stats Bar */}
        <HomeStatsBar
          totalBurned={totalBurned}
          leaderTicker={top1Coin?.ticker || "BATON"}
          leaderMcap={top1Coin?.marketCap || 0}
          activeRooms={activeRooms}
          totalVolume24h={totalVolume24h}
          isLoading={isLoading}
          onOutbidClick={() => handleOpenOutbid(top1Coin)}
        />

        {/* ── PRIMARY FOCUS: Callouts Stream (Hero) ───────────────────── */}
        <LiveCalloutsFeed
          initialCallouts={recentCallouts}
          isLoading={isLoading}
          onBoostCoin={handleOpenOutbid}
        />

        {/* ── 2-Column Split Grid: Attention Ladder & Side Tools ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (col-span-8): #1 King + #2-10 Ranked Attention Ladder */}
          <section className="lg:col-span-8 space-y-6">
            {/* Rank #1 King of the Hill Card */}
            <KingOfHillCard
              coin={top1Coin}
              isLoading={isLoading}
              onOutbidClick={handleOpenOutbid}
            />

            {/* Ranked Attention Ladder Table (#2 to #10+) */}
            <RankedAttentionTable
              coins={rankedCoins}
              isLoading={isLoading}
              onOutbidClick={handleOpenOutbid}
            />
          </section>

          {/* Right Column (col-span-4): QuickSwap + Live Caller Signals */}
          <aside className="lg:col-span-4 space-y-6">
            {/* 1. Quick Swap Card: SOL -> BATON Route via Jupiter */}
            <QuickSwapCard />

            {/* 2. Live Verified Caller Pulse Stream */}
            <LiveSignalsCompact
              initialCallouts={recentCallouts}
              isLoading={isLoading}
            />
          </aside>
        </div>
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. On-Chain Outbid Burn Modal */}
      <OutbidModal
        targetCoin={selectedCoinForOutbid}
        isOpen={isModalOpen}
        onClose={handleCloseOutbid}
        onSuccess={() => {
          refresh();
        }}
      />
    </div>
  );
}
