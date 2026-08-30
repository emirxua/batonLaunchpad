"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Menu, X, Wallet } from "lucide-react";
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

  // 4 Static Outbid Navigation links
  const navLinks = [
    {
      name: "Callouts & Trending",
      href: "/callouts",
    },
    {
      name: "Terminal Swap",
      href: "/terminal",
    },
    {
      name: "Burn-to-Rank",
      href: "/leaderboard",
    },
    {
      name: "About / Docs",
      href: "/directory",
    },
  ];

  return (
    <>
      <header className="w-full bg-white/95 dark:bg-[#090A0D]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 sticky top-0 z-40 transition-colors select-none">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between gap-4 py-2.5 sm:py-3">
          {/* ── Left: OUTBID Brand Logo + Navigation Links ─────────────── */}
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 select-none cursor-pointer flex-shrink-0 group"
              title="Outbid - Solana Alpha Callouts & Fast DEX Terminal"
            >
              {/* 3 Çizgili Kehribar Logo İkonu */}
              <div className="flex flex-col justify-center gap-[4px]">
                <span className="w-5 h-[3px] bg-[#f59e0b] rounded-full group-hover:scale-x-110 transition-transform"></span>
                <span className="w-5 h-[3px] bg-[#f59e0b] rounded-full group-hover:scale-x-110 transition-transform"></span>
                <span className="w-5 h-[3px] bg-[#f59e0b] rounded-full group-hover:scale-x-110 transition-transform"></span>
              </div>

              {/* Marka İsmi ve Açıklaması */}
              <div className="flex flex-col">
                <div className="text-xl font-black tracking-wider flex items-center font-mono">
                  <span className="text-[#f59e0b]">OUTBID</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono -mt-1 hidden sm:block tracking-tight">
                  Solana Alpha Callouts &amp; Fast DEX Terminal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Statik 4 Sekme) */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 font-mono text-xs font-bold">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/directory"
                    ? pathname === "/directory"
                    : pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 font-black"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* ── Right: Official X (Twitter), Theme Toggle & Connect Wallet ─ */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Official Twitter (X) Button */}
            <a
              href="https://x.com/metoutbid"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/30 transition-all font-mono text-xs font-bold"
              title="Follow @metoutbid on X"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="hidden sm:inline">@metoutbid</span>
            </a>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Wallet Connect Button */}
            <div className="flex-shrink-0">
              <WalletMultiButton />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white md:hidden transition-colors flex-shrink-0 cursor-pointer"
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
                link.href === "/directory"
                  ? pathname === "/directory"
                  : pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/30"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Mobile Social Link */}
            <div className="pt-2 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-bold text-amber-500">Official Social:</span>
              <a
                href="https://x.com/metoutbid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>@metoutbid</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navbar;
