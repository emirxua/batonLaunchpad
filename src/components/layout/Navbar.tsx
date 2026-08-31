"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SetUsernameModal } from "@/components/modals/SetUsernameModal";
import { AuthModal } from "@/components/modals/AuthModal";
import {
  Menu,
  X,
  Wallet,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  LogIn,
  Link as LinkIcon,
  Users,
} from "lucide-react";
import useSWR from "swr";
import { ThemeToggle } from "@/components/ThemeToggle";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const { data: activeUsersData } = useSWR("/api/stats/active-users", fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  const activeCount = activeUsersData?.activeUsers ?? 1;

  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();

  const {
    user,
    username,
    email,
    isLoggedIn,
    needsUsername,
    isUsernameModalOpen,
    openUsernameModal,
    closeUsernameModal,
    loginWithGoogle,
    logout: logoutGoogle,
    claimUsername,
  } = useUserProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const isAuth = isLoggedIn || connected;
  const userIdentifier =
    username ||
    (publicKey
      ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
      : user?.name || "User");

  const handleSignOut = () => {
    logoutGoogle();
    if (connected) {
      disconnect();
    }
  };

  const navLinks = [
    {
      name: "Callouts Feed",
      href: "/",
    },
    {
      name: "Terminal Swap",
      href: "/terminal",
    },
    {
      name: "Burn-to-Rank",
      href: "/leaderboard",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-[#07080A]/95 backdrop-blur-xl transition-colors select-none font-mono">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* ── Left: Logo & Live Presence ───────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("outbid:set-tab", { detail: "callouts" })
                  );
                  window.dispatchEvent(new CustomEvent("outbid:reset-feed"));
                }
              }}
              className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer shrink-0"
            >
              {/* 3 Unified Amber/Orange Outbid Stripes */}
              <div className="flex flex-col gap-1 w-4 sm:w-5 h-3.5 sm:h-4 justify-center shrink-0">
                <span className="w-full h-0.5 sm:h-1 bg-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all" />
                <span className="w-full h-0.5 sm:h-1 bg-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all" />
                <span className="w-full h-0.5 sm:h-1 bg-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all" />
              </div>

              {/* Brand Name & Whisper-Quiet Live Count */}
              <div className="text-lg sm:text-xl font-black tracking-wider flex items-center gap-2 font-mono leading-none">
                <span className="text-[#f59e0b]">OUTBID</span>
                <span
                  className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium font-mono select-none"
                  title="Active users"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                  <span>{activeCount}</span>
                </span>
              </div>
            </Link>
          </div>

          {/* ── Center: Navigation Tabs ──────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 font-mono text-xs font-bold shrink-0 mx-auto">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    if (link.href === "/" && typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("outbid:set-tab", { detail: "callouts" })
                      );
                    }
                  }}
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

          {/* ── Right: Twitter, Auth / Profile, Wallet, Theme ─────────── */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Official Twitter (X) Direct Link (Desktop only) */}
            <a
              href="https://x.com/batonoutbid"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-zinc-200 dark:hover:border-white/10 transition-all text-xs font-medium shrink-0 group cursor-pointer"
              title="Official X: @batonoutbid"
            >
              <div className="w-4 h-4 rounded-lg bg-zinc-200/60 dark:bg-white/10 flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                @batonoutbid
              </span>
            </a>

            {/* ── Authenticated User State ───────────────────────────── */}
            {!isAuth ? (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0 active:scale-95 uppercase tracking-wider"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : needsUsername ? (
              <button
                type="button"
                onClick={openUsernameModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-xs shadow-md animate-pulse cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Choose @handle</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* User Handle Badge & Dropdown */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-500 flex items-center justify-center text-[10px] font-black shrink-0 overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        <span>{userIdentifier.slice(0, 1).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="max-w-[70px] sm:max-w-[110px] truncate">
                      {username ? `@${username}` : userIdentifier}
                    </span>
                    <ChevronDown className="w-3 h-3 text-amber-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0E1015] border border-zinc-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl space-y-1 z-50 font-mono text-xs animate-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/5">
                        <span className="text-[10px] text-zinc-400 block">Signed in as</span>
                        <span className="font-bold text-amber-400 truncate block">
                          {username ? `@${username}` : userIdentifier}
                        </span>
                        {email && <span className="text-[9px] text-zinc-500 truncate block mt-0.5">{email}</span>}
                        {connected && publicKey && (
                          <span className="text-[9px] text-purple-400 truncate block mt-0.5 font-mono">
                            Wallet: {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          openUsernameModal();
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{username ? "Edit Handle" : "Claim @handle"}</span>
                      </button>

                      {/* Wallet Toggle in Dropdown */}
                      {!connected ? (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            openWalletModal(true);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-purple-400 hover:bg-purple-500/10 flex items-center gap-2 transition-colors cursor-pointer font-bold"
                        >
                          <Wallet className="w-3.5 h-3.5 text-purple-400" />
                          <span>Connect Solana Wallet</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            disconnect();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer text-[11px]"
                        >
                          <Wallet className="w-3.5 h-3.5 text-purple-400" />
                          <span>Disconnect Wallet</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleSignOut();
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Direct "Connect Wallet" / Interactive Connected Wallet Pill ── */}
                {!connected ? (
                  <button
                    type="button"
                    onClick={() => openWalletModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 hover:text-purple-300 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                    title="Connect Solana Wallet"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Wallet</span>
                  </button>
                ) : (
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setWalletDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer shrink-0 font-mono active:scale-95"
                      title="Manage Connected Wallet"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                      <span className="text-[11px]">
                        {publicKey ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}` : "Wallet"}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-purple-400 transition-transform ${walletDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {walletDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#0E1015] border border-zinc-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl space-y-1 z-50 font-mono text-xs animate-in zoom-in-95 duration-100">
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-white/5 space-y-1">
                          <span className="text-[10px] text-zinc-400 block font-bold uppercase">Connected Solana Wallet</span>
                          <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-purple-400 font-bold">
                            <span className="truncate">{publicKey ? `${publicKey.toBase58().slice(0, 8)}…${publicKey.toBase58().slice(-6)}` : ""}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (publicKey) {
                                  navigator.clipboard.writeText(publicKey.toBase58());
                                }
                              }}
                              className="p-1 hover:text-white text-zinc-400 transition-colors cursor-pointer"
                              title="Copy full address"
                            >
                              <LinkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Solscan link */}
                        {publicKey && (
                          <a
                            href={`https://solscan.io/account/${publicKey.toBase58()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-between transition-colors text-[11px] font-bold"
                          >
                            <span>View on Solscan</span>
                            <LinkIcon className="w-3 h-3 text-zinc-500" />
                          </a>
                        )}

                        {/* Change Wallet */}
                        <button
                          type="button"
                          onClick={() => {
                            setWalletDropdownOpen(false);
                            openWalletModal(true);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-purple-400 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer text-[11px] font-bold"
                        >
                          <Wallet className="w-3.5 h-3.5 text-purple-400" />
                          <span>Change Wallet</span>
                        </button>

                        {/* Disconnect Wallet */}
                        <button
                          type="button"
                          onClick={() => {
                            setWalletDropdownOpen(false);
                            disconnect();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer text-[11px] font-bold border-t border-zinc-100 dark:border-white/5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Disconnect Wallet</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle (Desktop Only, automatically system on mobile) */}
            <div className="shrink-0 hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Mobile Hamburger Button */}
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
          <div className="lg:hidden border-t border-zinc-200 dark:border-white/10 bg-white/98 dark:bg-[#0D0E12]/98 backdrop-blur-2xl px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150 font-mono shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Theme Mode</span>
              <ThemeToggle />
            </div>

            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));

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

            {!isAuth ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full text-center px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-zinc-950 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md flex items-center justify-center gap-2 mt-2 uppercase tracking-wider"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In (Google / Wallet)</span>
              </button>
            ) : (
              <div className="pt-2 border-t border-zinc-100 dark:border-white/5 space-y-2">
                {!connected ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openWalletModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 flex items-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Solana Wallet</span>
                  </button>
                ) : (
                  <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center justify-between">
                    <span className="font-mono">{publicKey?.toBase58().slice(0, 4)}…{publicKey?.toBase58().slice(-4)}</span>
                    <button onClick={() => disconnect()} className="text-[10px] text-zinc-400 hover:text-rose-400 font-bold">
                      Disconnect
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openUsernameModal();
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>{username ? `@${username} (Edit Handle)` : "Choose @handle"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Unified Sign In Modal (Google + Wallet) ────────────────────── */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onGoogleSuccess={loginWithGoogle}
      />

      {/* ── Unique Username Registration Modal ─────────────────────────── */}
      <SetUsernameModal
        isOpen={isUsernameModalOpen}
        onClose={closeUsernameModal}
        userEmail={email}
        currentUsername={username}
        isRequired={needsUsername}
        onClaimUsername={claimUsername}
      />
    </>
  );
};

export default Navbar;
