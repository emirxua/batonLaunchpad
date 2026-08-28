"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { Menu, X, Wallet, Trophy, Rocket, Flame } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Dynamic import for WalletMultiButton to prevent SSR hydration mismatches
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        className="wallet-adapter-button"
        disabled
      >
        <Wallet className="w-3.5 h-3.5" />
        <span>CONNECT WALLET</span>
      </button>
    ),
  }
);

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"all-time" | "today">("all-time");
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { name: "Directory", href: "/" },
    { name: "Callout Rewards", href: "/callouts", isNew: true, icon: Flame },
    { name: "Launchpad Hub", href: "/launchpad" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Submit Token", href: "/submit" },
  ];

  const formattedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <>
      <header className="w-full bg-white/90 dark:bg-[#0B0C0E]/90 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 sticky top-0 z-40">
        <div className="w-full max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: Logo & All-time/Today Pill */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2 group select-none shrink-0">
              {/* Outbid horizontal bars icon */}
              <div className="flex flex-col gap-1 w-6 h-4 justify-center">
                <span className="w-full h-1 bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
                <span className="w-4/5 h-1 bg-orange-500 rounded-full transition-transform group-hover:scale-x-125 origin-left" />
                <span className="w-3/5 h-1 bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
              </div>
              <span className="font-archivo text-xl tracking-tight flex items-center select-none">
                <span className="text-zinc-900 dark:text-white font-extrabold tracking-tight">BATON</span>
                <span className="text-orange-500 font-extrabold tracking-tight">OUTBID.ICU</span>
              </span>
            </Link>

            {/* Pill Filter Toggle: All-time / Today */}
            <div className="hidden lg:flex items-center p-1 bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/10 rounded-full font-mono text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setTimeFilter("all-time")}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  timeFilter === "all-time"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <Trophy className="w-3 h-3 text-amber-500" />
                <span>All-time</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("today")}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  timeFilter === "today"
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Today</span>
              </button>
            </div>
          </div>

          {/* Center: Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-mono font-bold tracking-wide">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors py-1 flex items-center gap-1.5"
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-orange-500 fill-current" />}
                  <span>{link.name}</span>
                  {link.isNew && (
                    <span className="px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-[9px] font-black tracking-wider shadow-sm animate-pulse">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Wallet */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-nowrap">
            {/* Launchpad CTA button */}
            <Link
              href="/launchpad"
              className="hidden sm:inline-flex h-10 px-4 items-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white dark:text-orange-400 dark:hover:text-white border border-orange-500/30 transition-all shadow-sm shrink-0"
            >
              <Rocket className="w-4 h-4" />
              <span>Explore Launchpad 🚀</span>
            </Link>

            {/* Theme Toggle Button */}
            <div className="shrink-0">
              <ThemeToggle />
            </div>

            {/* Desktop Connect Wallet */}
            <div className="hidden sm:flex items-center shrink-0">
              {mounted && <WalletMultiButton />}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-orange-500" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-0 right-0 bottom-0 w-4/5 max-w-xs bg-white dark:bg-[#111318] border-l border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <span className="font-archivo text-lg tracking-tight flex items-center select-none">
                  <span className="text-zinc-900 dark:text-white font-extrabold tracking-tight">BATON</span>
                  <span className="text-orange-500 font-extrabold tracking-tight">OUTBID.ICU</span>
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="font-mono text-xs uppercase font-bold tracking-wider text-zinc-700 dark:text-zinc-300 hover:text-orange-500 py-2.5 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-3.5 h-3.5 text-orange-500 fill-current" />}
                        <span>{link.name}</span>
                      </div>
                      {link.isNew && (
                        <span className="px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-[9px] font-black tracking-wider">
                          NEW
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Wallet Section */}
            <div className="space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/launchpad"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-mono text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Explore Launchpad 🚀</span>
              </Link>
              <div className="w-full flex justify-center">
                {mounted && <WalletMultiButton />}
              </div>
              {connected && (
                <div className="text-center font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 py-1.5 px-2 rounded-lg truncate">
                  Connected: {formattedAddress}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
