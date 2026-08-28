"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { Menu, X, Flame, Wallet } from "lucide-react";
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
        <span>LOADING WALLET...</span>
      </button>
    ),
  }
);

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { name: "Directory", href: "/#directory" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Submit Coin", href: "/submit" },
    { name: "About", href: "/#about" },
  ];

  // Format public key address as "7xK...9mP"
  const formattedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <>
      <nav className="w-full bg-bg/95 backdrop-blur-md border-b border-line sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-magenta/40 bg-magenta/20 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(255,61,122,0.3)]">
              <Image
                src="https://cdn.dexscreener.com/cms/images/B_1EShunz2lCb0jz?width=800&height=800&quality=95&format=auto"
                alt="Baton Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <span className="font-archivo text-[18px] tracking-wider text-text uppercase group-hover:text-acid transition-colors">
              BATON<span className="text-magenta">.</span>LAUNCH
            </span>
          </Link>

          {/* Desktop Center Menu Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="font-mono text-[12px] uppercase tracking-wider text-text-dim hover:text-acid transition-colors font-medium relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-acid hover:after:w-full after:transition-all"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Action & Mobile Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Official X (Twitter) Link */}
            <a
              href="https://x.com/buybaton"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-line bg-bg-raised/80 text-text-dim hover:text-text hover:border-text-dim transition-colors flex items-center justify-center"
              title="Official X: @buybaton"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Desktop Connect Wallet Multi Button */}
            <div className="hidden sm:block">
              {mounted && <WalletMultiButton />}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-line text-text-dim hover:text-text hover:border-text-dim transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-acid" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-4/5 max-w-xs bg-bg-card border-l border-line p-6 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-line">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-magenta rotate-45 rounded-[2px]" />
                  <span className="font-archivo text-base text-text">
                    BATON.LAUNCH
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg border border-line text-text-dim hover:text-text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-mono text-[13px] uppercase tracking-wider text-text-dim hover:text-acid py-2 px-3 rounded-lg hover:bg-bg-raised transition-colors flex items-center justify-between"
                  >
                    <span>{link.name}</span>
                    <span className="text-text-faint">→</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="space-y-3 pt-6 border-t border-line">
              <div className="w-full flex justify-center">
                {mounted && <WalletMultiButton />}
              </div>

              {connected && (
                <div className="text-center font-mono text-xs text-acid bg-acid/10 border border-acid/20 py-1.5 px-2 rounded-lg">
                  Connected: {formattedAddress}
                </div>
              )}

              <p className="text-[11px] text-center text-text-faint font-mono">
                Solana pump.fun Ecosystem • $BATON
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
