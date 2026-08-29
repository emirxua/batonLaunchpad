"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronDown,
  Rocket,
  PlusCircle,
  BarChart3,
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
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  }, [pathname]);

  // Click outside listener for "More" dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4 Essential Main Links
  const primaryLinks = [
    {
      name: "Terminal",
      href: "/terminal",
      icon: Zap,
      badge: "NEW",
    },
    {
      name: "Callouts",
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

  // Secondary Links inside "More ▾" dropdown
  const secondaryLinks = [
    { name: "Launchpad Hub", href: "/launchpad", icon: Rocket },
    { name: "Submit Token", href: "/submit", icon: PlusCircle },
    { name: "Burn Stats", href: "/leaderboard", icon: BarChart3 },
  ];

  return (
    <>
      <header className="w-full bg-white/95 dark:bg-[#090A0D]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between gap-4 py-2.5 sm:py-3">
          {/* ── Left: Logo + 4 Essential Links + More Dropdown ───────── */}
          <div className="flex items-center gap-4 lg:gap-6 min-w-0">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group select-none flex-shrink-0"
            >
              <div className="flex flex-col gap-1 w-5 h-3.5 justify-center">
                <span className="w-full h-0.5 bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
                <span className="w-4/5 h-0.5 bg-orange-500 rounded-full transition-transform group-hover:scale-x-125 origin-left" />
                <span className="w-3/5 h-0.5 bg-zinc-900 dark:bg-white rounded-full transition-transform group-hover:scale-x-110 origin-left" />
              </div>
              <span className="font-archivo text-lg sm:text-xl tracking-tight flex items-center select-none">
                <span className="text-zinc-900 dark:text-white font-black tracking-tight">
                  BATON
                </span>
                <span className="text-orange-500 font-black tracking-tight">
                  OUTBID.ICU
                </span>
              </span>
            </Link>

            {/* Desktop Navigation Links: 4 Essential Links + More ▾ */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 font-mono text-xs font-bold">
              {primaryLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === "/"
                    ? pathname === "/" || pathname === "/directory"
                    : pathname?.startsWith(link.href);

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 relative whitespace-nowrap ${
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

              {/* "More ▾" Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setMoreDropdownOpen((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 font-mono text-xs font-bold ${
                    moreDropdownOpen
                      ? "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>More</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      moreDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {moreDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#111317] border border-zinc-200 dark:border-white/10 shadow-xl py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 font-mono text-xs">
                    {secondaryLinks.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className="flex items-center gap-2 px-3.5 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 transition-colors font-bold"
                        >
                          <ItemIcon className="w-3.5 h-3.5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* ── Right: Theme Toggle & Select Wallet Button ───────────── */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Select Wallet Button - Always neatly contained without overflowing */}
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
            {/* 4 Essential Links */}
            {primaryLinks.map((link) => {
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

            {/* Divider */}
            <div className="border-t border-zinc-200 dark:border-white/5 my-1" />

            {/* Secondary Links */}
            {secondaryLinks.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center gap-2.5"
                >
                  <ItemIcon className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{item.name}</span>
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
