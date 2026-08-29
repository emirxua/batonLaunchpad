"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import {
  Menu,
  X,
  Wallet,
  Zap,
  Flame,
  Trophy,
  FolderTree,
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
        className="wallet-adapter-button flex-shrink-0"
        disabled
      >
        <Wallet className="w-3.5 h-3.5" />
        <span>SELECT WALLET</span>
      </button>
    ),
  }
);

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // 4 Essential Links ONLY
  const navLinks = [
    {
      name: "Terminal",
      href: "/terminal",
      icon: Zap,
      badge: "NEW",
    },
    {
      name: "Live Callouts",
      href: "/callouts",
      icon: Flame,
    },
    {
      name: "Directory",
      href: "/",
      icon: FolderTree,
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
      icon: Trophy,
    },
  ];

  return (
    <>
      <header className="w-full bg-white/95 dark:bg-[#090A0D]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between gap-4 py-2.5 sm:py-3">
          {/* ── Left: Logo + 4 Essential Links ─────────────────────────── */}
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group select-none flex-shrink-0"
            >
              <div className="flex flex-col gap-1 w-5 h-3.5 justify-center">
                <span className="w-full h-0.5 bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
                <span className="w-4/5 h-0.5 bg-amber-500 rounded-full transition-transform group-hover:scale-x-125 origin-left" />
                <span className="w-3/5 h-0.5 bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
              </div>
              <span className="font-archivo text-lg sm:text-xl tracking-tight flex items-center select-none">
                <span className="text-amber-500 font-black tracking-tight">
                  OUTBID
                </span>
                <span className="text-zinc-800 dark:text-zinc-200 font-bold tracking-tight">
                  .BOND
                </span>
              </span>
            </Link>

            {/* Desktop Navigation Links: 4 Links Only */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 font-mono text-xs font-bold">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === "/"
                    ? pathname === "/" || pathname === "/directory"
                    : pathname?.startsWith(link.href);

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? "bg-orange-500/15 text-orange-500 dark:text-orange-400 font-black"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider bg-orange-500 text-white shadow-sm shadow-orange-500/50">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ── Right: Theme Toggle & Select Wallet Button ───────────── */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Select Wallet Button - Cleanly positioned inside layout */}
            <div className="flex-shrink-0">
              <WalletMultiButton />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white md:hidden transition-colors flex-shrink-0"
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
          <div className="md:hidden border-t border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#0D0E12]/95 backdrop-blur-xl px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150 font-mono">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/"
                  ? pathname === "/" || pathname === "/directory"
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
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-orange-500 text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
