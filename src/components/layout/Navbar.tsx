"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SetUsernameModal } from "@/components/modals/SetUsernameModal";
import { Menu, X, Wallet, User, Sparkles } from "lucide-react";
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
        className="wallet-adapter-button flex-shrink-0 text-xs px-3 py-1.5"
        disabled
      >
        <Wallet className="w-3.5 h-3.5" />
        <span>WALLET</span>
      </button>
    ),
  }
);

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { connected } = useWallet();
  const {
    username,
    walletAddress,
    isUsernameModalOpen,
    openUsernameModal,
    closeUsernameModal,
    claimUsername,
  } = useUserProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // 4 Clean, Concise Outbid Navigation links
  const navLinks = [
    {
      name: "Callouts",
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
      name: "About",
      href: "/about",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-[#07080A]/95 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* ── Left: Logo ───────────────────────────────────────────── */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 group select-none cursor-pointer shrink-0"
            >
              {/* 3 Unified Amber/Orange Outbid Stripes */}
              <div className="flex flex-col gap-1 w-4 sm:w-5 h-3.5 sm:h-4 justify-center shrink-0">
                <span className="w-full h-0.5 sm:h-1 bg-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all group-hover:w-full" />
                <span className="w-3/4 h-0.5 sm:h-1 bg-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all group-hover:w-full" />
                <span className="w-full h-0.5 sm:h-1 bg-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all group-hover:w-full" />
              </div>

              {/* Brand Name */}
              <div className="flex flex-col">
                <div className="text-lg sm:text-xl font-black tracking-wider flex items-center font-mono leading-none">
                  <span className="text-[#f59e0b]">OUTBID</span>
                </div>
                <span className="text-[8px] sm:text-[9px] text-zinc-500 font-mono hidden md:block tracking-tight mt-0.5">
                  Solana Alpha Callouts &amp; Fast DEX Terminal
                </span>
              </div>
            </Link>
          </div>

          {/* ── Center: Desktop Navigation Tabs (Perfect Centering, Zero Overlap) ─ */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 font-mono text-xs font-bold shrink-0 mx-auto">
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
                      ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 font-black shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* ── Right: Twitter, Handle Pill, Theme & Connect Wallet ───── */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Official Twitter (X) Button (Desktop / Tablet) */}
            <a
              href="https://x.com/batonoutbid"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/30 transition-all font-mono text-xs font-bold shrink-0"
              title="Follow @batonoutbid on X"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="hidden xl:inline">@batonoutbid</span>
            </a>

            {/* Registered Handle Pill (If wallet connected) */}
            {connected && (
              <button
                type="button"
                onClick={openUsernameModal}
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400 text-xs font-mono font-bold hover:bg-amber-500/20 transition-all cursor-pointer shrink-0 max-w-[70px] sm:max-w-[120px] truncate"
                title={username ? `@${username} (Click to edit)` : "Claim your handle"}
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{username ? `@${username}` : "+ Handle"}</span>
              </button>
            )}

            {/* Theme Toggle */}
            <div className="shrink-0">
              <ThemeToggle />
            </div>

            {/* Wallet Connect Button */}
            <div className="shrink-0 scale-90 sm:scale-100 origin-right">
              <WalletMultiButton />
            </div>

            {/* Mobile / Tablet Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-1.5 sm:p-2 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white lg:hidden transition-colors shrink-0 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-4 sm:w-5 h-4 sm:h-5" />
              ) : (
                <Menu className="w-4 sm:w-5 h-4 sm:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile Navigation Drawer ───────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-zinc-200 dark:border-white/10 bg-white/98 dark:bg-[#0D0E12]/98 backdrop-blur-2xl px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150 font-mono shadow-2xl">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/directory"
                  ? pathname === "/directory"
                  : pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`block px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 font-black"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {connected && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openUsernameModal();
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 mt-2"
              >
                <User className="w-4 h-4" />
                <span>{username ? `@${username} (Edit Handle)` : "+ Claim Handle"}</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Handle Registration Modal ─────────────────────────────────── */}
      <SetUsernameModal
        isOpen={isUsernameModalOpen}
        onClose={closeUsernameModal}
        walletAddress={walletAddress}
        onClaimUsername={claimUsername}
      />
    </>
  );
};

export default Navbar;
