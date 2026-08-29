"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useTokenStats } from "@/hooks/useTokenStats";
import {
  Menu,
  X,
  Wallet,
  Zap,
  Flame,
  Trophy,
  FolderTree,
  BarChart3,
  ExternalLink,
} from "lucide-react";
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
  const pathname = usePathname();
  const { totalBurned } = useTokenStats();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      name: "Terminal",
      href: "/terminal",
      icon: Zap,
      badge: "NEW",
      badgeClass: "bg-orange-500 text-white animate-pulse shadow-sm shadow-orange-500/50",
    },
    {
      name: "Callouts",
      href: "/callouts",
      icon: Flame,
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
    },
    {
      name: "Directory",
      href: "/",
      icon: FolderTree,
    },
    {
      name: "Burn Stats",
      href: "/leaderboard",
      icon: BarChart3,
    },
  ];

  return (
    <>
      <header className="w-full bg-white/95 dark:bg-[#090A0D]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 sticky top-0 z-40 transition-colors">
        <div className="w-full max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
          {/* ── Left: Brand Logo ───────────────────────────────────────── */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group select-none shrink-0">
              {/* Outbid horizontal bars icon */}
              <div className="flex flex-col gap-1 w-5 h-3.5 justify-center">
                <span className="w-full h-0.5 bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
                <span className="w-4/5 h-0.5 bg-orange-500 rounded-full transition-transform group-hover:scale-x-125 origin-left" />
                <span className="w-3/5 h-0.5 bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
              </div>
              <span className="font-archivo text-lg sm:text-xl tracking-tight flex items-center select-none">
                <span className="text-zinc-900 dark:text-white font-black tracking-tight">BATON</span>
                <span className="text-orange-500 font-black tracking-tight">OUTBID.ICU</span>
              </span>
            </Link>
          </div>

          {/* ── Center: Desktop Navigation Links ───────────────────────── */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 font-mono text-xs font-bold">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 relative ${
                    isActive
                      ? "bg-orange-500/15 text-orange-500 dark:text-orange-400 font-black"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span>{link.name}</span>
                  {link.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider ${link.badgeClass}`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right: Live Burn Badge & Wallet Button ─────────────────── */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live $BATON Burn Badge */}
            <Link
              href="/leaderboard"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/25 hover:border-orange-500/50 text-orange-400 text-[11px] font-mono font-bold transition-all shadow-[0_0_10px_rgba(249,115,22,0.1)]"
              title="Verified On-chain $BATON Burns"
            >
              <Flame className="w-3.5 h-3.5 fill-current text-orange-400 animate-pulse" />
              <span>{Math.round(totalBurned).toLocaleString("en-US")} Burned</span>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Wallet Button */}
            <div className="shrink-0">
              <WalletMultiButton />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white md:hidden transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile Navigation Drawer ───────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#0D0E12]/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200 font-mono">
            {/* Mobile Live $BATON Badge */}
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-current animate-pulse" />
                <span>On-Chain $BATON Burned:</span>
              </div>
              <span className="text-white font-black">
                {Math.round(totalBurned).toLocaleString("en-US")}
              </span>
            </div>

            {/* Mobile Links */}
            <div className="grid grid-cols-1 gap-1 pt-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(link.href);

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                      isActive
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{link.name}</span>
                    </div>

                    {link.badge && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${link.badgeClass}`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
