"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Menu,
  X,
  Wallet,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const BATON_CA = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkpump";

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
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleCopyCA = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(BATON_CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 4 Essential Navigation links — text only, no badges, no emojis
  const navLinks = [
    {
      name: "Terminal",
      href: "/terminal",
    },
    {
      name: "Live Callouts",
      href: "/callouts",
    },
    {
      name: "Directory",
      href: "/directory",
    },
    {
      name: "Leaderboard",
      href: "/leaderboard",
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
                <span className="w-full h-0.5 bg-zinc-50 dark:bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
                <span className="w-4/5 h-0.5 bg-amber-500 rounded-full transition-transform group-hover:scale-x-125 origin-left" />
                <span className="w-3/5 h-0.5 bg-zinc-50 dark:bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
              </div>
              <span className="font-archivo text-lg sm:text-xl tracking-tight flex items-center select-none">
                <span className="text-amber-500 font-bold tracking-tight">
                  OUTBID
                </span>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  .BOND
                </span>
              </span>
            </Link>

            {/* Desktop Navigation Links: 4 Links Only */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 font-mono text-xs font-bold">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/directory" || link.href === "/"
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
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ── Right: $BATON CA Badge, Theme Toggle & Select Wallet Button ─ */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* $BATON CA Solscan Link Badge */}
            <div className="hidden lg:flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 rounded-lg px-2.5 py-1 font-mono text-[11px]">
              <span className="font-bold text-amber-500">$BATON:</span>
              <span className="text-zinc-500 dark:text-zinc-400">{BATON_CA.slice(0, 4)}…{BATON_CA.slice(-4)}</span>
              <button
                type="button"
                onClick={handleCopyCA}
                className="p-0.5 hover:text-white text-zinc-500 transition-colors cursor-pointer"
                title="Copy $BATON CA"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
              <a
                href={`https://solscan.io/token/${BATON_CA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-0.5 hover:text-amber-400 text-zinc-500 transition-colors"
                title="View on Solscan Explorer"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Select Wallet Button */}
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
              const isActive =
                link.href === "/directory" || link.href === "/"
                  ? pathname === "/" || pathname === "/directory"
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-orange-500 text-zinc-950 dark:text-white shadow-md shadow-orange-500/30"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Mobile CA Link */}
            <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-bold text-amber-500">$BATON CA:</span>
              <div className="flex items-center gap-2">
                <span>{BATON_CA.slice(0, 4)}…{BATON_CA.slice(-4)}</span>
                <a
                  href={`https://solscan.io/token/${BATON_CA}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Solscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
