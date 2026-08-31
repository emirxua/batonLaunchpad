"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import { TrendingTokenItem } from "@/types/token";
import {
  Zap,
  ChevronDown,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ArrowUpDown,
  Search,
  Check,
} from "lucide-react";
import { useMarketStats } from "@/hooks/useMarketData";
import { SolanaLogo } from "@/components/common/SolanaLogo";

interface QuickSwapCardProps {
  targetMint?: string;
  targetSymbol?: string;
  targetName?: string;
  targetIconUrl?: string;
  onTokenChange?: (mint: string, symbol: string) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function base64ToBytes(base64: string): Uint8Array {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return Buffer.from(base64, "base64");
}

export function QuickSwapCard({
  targetMint = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump",
  targetSymbol = "BATON",
  targetName = "Baton Corporation",
  targetIconUrl,
  onTokenChange,
}: QuickSwapCardProps) {
  const { data: trendingData } = useSWR("/api/trending", fetcher, {
    refreshInterval: 6_000,
    revalidateOnFocus: true,
    dedupingInterval: 3_000,
  });

  const { data: solPairData } = useSWR(
    "https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112",
    fetcher,
    {
      refreshInterval: 10_000,
      revalidateOnFocus: false,
      dedupingInterval: 5_000,
    }
  );

  const liveSolPrice = React.useMemo(() => {
    const pairs = solPairData?.pairs || [];
    const solPair = pairs.find((p: any) => p.quoteToken?.symbol === "USDC" || p.quoteToken?.symbol === "USDT");
    return parseFloat(solPair?.priceUsd || "0") || 106.5;
  }, [solPairData]);

  const liveTokensList: TrendingTokenItem[] = React.useMemo(() => {
    const rawTokens: any[] = trendingData?.tokens || trendingData?.data || [];
    return rawTokens.map((t: any) => ({
      id: `token-${t.mint || t.ca}`,
      name: t.name || "Solana Token",
      symbol: (t.symbol || "TOKEN").toUpperCase(),
      ca: t.mint || t.ca,
      price: t.priceUsd ?? t.price ?? 0,
      priceFormatted: t.priceFormatted || `$${(t.priceUsd || 0).toFixed(6)}`,
      mcap: t.marketCap ?? t.mcap ?? 0,
      mcapFormatted: t.mcapFormatted || "$0",
      volume24h: t.volume24h ?? 0,
      volumeFormatted: t.volumeFormatted || "$0",
      priceChange24h: t.priceChange24h ?? 0,
      priceChangeFormatted: t.priceChangeFormatted || "0%",
      bondingCurveProgress: t.bondingCurveProgress || 100,
      badge: t.badge || "Trending",
      iconUrl: t.iconUrl || undefined,
      dexScreenerUrl: t.dexScreenerUrl || `https://dexscreener.com/solana/${t.mint || t.ca}`,
    }));
  }, [trendingData]);

  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
  const BATON_DEFAULT_ICON = "/images/baton-logo.png";

  const [currentMint, setCurrentMint] = useState(targetMint || BATON_MINT);
  const [currentSymbol, setCurrentSymbol] = useState(targetSymbol || "BATON");
  const [currentName, setCurrentName] = useState(targetName || "Baton Corporation Ltd");
  const [currentIcon, setCurrentIcon] = useState<string | undefined>(targetIconUrl || BATON_DEFAULT_ICON);

  const [isReverse, setIsReverse] = useState<boolean>(false);
  const [solAmount, setSolAmount] = useState<string>("0.5");
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [swapping, setSwapping] = useState<boolean>(false);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Slippage Settings State (Auto Dynamic by default matching Jupiter official)
  const [slippageMode, setSlippageMode] = useState<"auto" | "0.5" | "1.0" | "5.0" | "custom">("auto");
  const [customSlippageVal, setCustomSlippageVal] = useState<string>("");

  const isCustomSlippage = slippageMode === "custom";
  const isAutoSlippage = slippageMode === "auto";

  const effectiveSlippage = isAutoSlippage
    ? 15 // Fallback cap for pump bonding curves
    : isCustomSlippage
    ? parseFloat(customSlippageVal) || 0.5
    : parseFloat(slippageMode);

  const effectiveSlippageLabel = isAutoSlippage
    ? "Auto (Dynamic)"
    : isCustomSlippage
    ? `${customSlippageVal || "0.5"}%`
    : `${slippageMode}%`;

  // Selector Modal
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [isSearchingCa, setIsSearchingCa] = useState(false);
  const [customTokenFound, setCustomTokenFound] = useState<TrendingTokenItem | null>(null);

  // Sync incoming props
  useEffect(() => {
    if (targetMint) {
      setCurrentMint(targetMint);
      setCurrentSymbol(targetSymbol || "TOKEN");
      if (targetName) setCurrentName(targetName);
      const foundInList = liveTokensList.find((t: any) => ((t.ca || t.mint || "") as string).toLowerCase() === targetMint.toLowerCase());
      setCurrentIcon(targetIconUrl || foundInList?.iconUrl || (targetMint === BATON_MINT ? BATON_DEFAULT_ICON : undefined));
    }
  }, [targetMint, targetSymbol, targetName, targetIconUrl, liveTokensList]);

  // Live user SOL & SPL token balance callback
  const fetchLiveBalances = React.useCallback(async () => {
    if (!connected || !publicKey) {
      setUserBalance(null);
      setTokenBalance(null);
      return;
    }

    try {
      // 1. High-speed internal balance proxy (Solana RPC)
      const res = await fetch(
        `/api/wallet-balance?wallet=${encodeURIComponent(publicKey.toBase58())}&mint=${encodeURIComponent(currentMint || "")}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        if (typeof data.solBalance === "number") setUserBalance(data.solBalance);
        if (typeof data.tokenBalance === "number") setTokenBalance(data.tokenBalance);
        return;
      }
    } catch {
      // Fallback to direct client RPC
    }

    if (connection) {
      // 2. SOL Balance Fallback
      try {
        const lamports = await connection.getBalance(publicKey, "confirmed");
        if (typeof lamports === "number") {
          setUserBalance(lamports / 1e9);
        }
      } catch (solErr) {
        console.warn("SOL balance fetch warning:", solErr);
      }

      // 3. Token Balance Fallback
      try {
        if (currentMint && currentMint !== "So11111111111111111111111111111111111111112") {
          const { PublicKey } = await import("@solana/web3.js");
          const resp = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { mint: new PublicKey(currentMint) },
            "confirmed"
          );
          const accounts = resp.value || [];
          if (accounts.length > 0) {
            const totalTokenAmount = accounts.reduce((acc, a) => {
              const amt = a?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
              return acc + amt;
            }, 0);
            setTokenBalance(totalTokenAmount);
          } else {
            setTokenBalance(0);
          }
        }
      } catch (tokErr) {
        console.warn("Token balance fetch warning:", tokErr);
      }
    }
  }, [connected, publicKey, currentMint, connection]);

  useEffect(() => {
    fetchLiveBalances();
    const interval = setInterval(fetchLiveBalances, 3000);
    return () => clearInterval(interval);
  }, [fetchLiveBalances]);

  const solPrice = liveSolPrice || 106.5;

  // Reactive Instant DexScreener CA Search via Internal Proxy
  // Search results for name / symbol / CA lookups
  const [searchResults, setSearchResults] = useState<TrendingTokenItem[]>([]);

  useEffect(() => {
    const trimmed = modalSearch.trim();
    if (!trimmed) {
      setCustomTokenFound(null);
      setSearchResults([]);
      setIsSearchingCa(false);
      return;
    }

    let isCurrent = true;
    setIsSearchingCa(true);

    const timer = setTimeout(() => {
      const ctrl = new AbortController();

      fetch(`/api/token-lookup?q=${encodeURIComponent(trimmed)}`, {
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Lookup error");
          const data = await res.json();
          if (!isCurrent) return;

          if (data && Array.isArray(data.results) && data.results.length > 0) {
            const mapped: TrendingTokenItem[] = data.results.map((r: any) => ({
              id: `token-${r.mint}`,
              ca: r.mint,
              symbol: r.symbol || "TOKEN",
              name: r.name || "Solana Token",
              iconUrl: r.iconUrl || undefined,
              price: r.priceUsd || 0,
              priceFormatted: r.priceUsd < 0.001 ? `$${r.priceUsd.toFixed(6)}` : `$${r.priceUsd.toFixed(4)}`,
              mcap: r.marketCap || 0,
              mcapFormatted: r.marketCap >= 1e6 ? `$${(r.marketCap / 1e6).toFixed(1)}M` : `$${(r.marketCap / 1e3).toFixed(0)}K`,
              volume24h: r.volume24h || 0,
              volumeFormatted: r.volume24h >= 1e6 ? `$${(r.volume24h / 1e6).toFixed(1)}M` : `$${(r.volume24h / 1e3).toFixed(0)}K`,
              priceChange24h: r.priceChange24h || 0,
              priceChangeFormatted: `${r.priceChange24h >= 0 ? "+" : ""}${r.priceChange24h.toFixed(1)}%`,
              bondingCurveProgress: 100,
              badge: "Hot",
            }));
            setSearchResults(mapped);
          } else if (data && data.mint) {
            setSearchResults([
              {
                id: `token-${data.mint}`,
                ca: data.mint,
                symbol: data.symbol || "TOKEN",
                name: data.name || "Solana Token",
                iconUrl: data.iconUrl || undefined,
                price: data.priceUsd || 0,
                priceFormatted: data.priceUsd < 0.001 ? `$${data.priceUsd.toFixed(6)}` : `$${data.priceUsd.toFixed(4)}`,
                mcap: data.marketCap || 0,
                mcapFormatted: data.marketCap >= 1e6 ? `$${(data.marketCap / 1e6).toFixed(1)}M` : `$${(data.marketCap / 1e3).toFixed(0)}K`,
                volume24h: data.volume24h || 0,
                volumeFormatted: data.volume24h >= 1e6 ? `$${(data.volume24h / 1e6).toFixed(1)}M` : `$${(data.volume24h / 1e3).toFixed(0)}K`,
                priceChange24h: data.priceChange24h || 0,
                priceChangeFormatted: `${data.priceChange24h >= 0 ? "+" : ""}${data.priceChange24h.toFixed(1)}%`,
                bondingCurveProgress: 100,
                badge: "Hot",
              },
            ]);
          } else {
            setSearchResults([]);
          }
        })
        .catch(() => {
          if (isCurrent) setSearchResults([]);
        })
        .finally(() => {
          if (isCurrent) setIsSearchingCa(false);
        });
    }, 150);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [modalSearch]);

  // Live DexScreener polling for whatever token is currently selected
  const { data: selectedPairData } = useSWR(
    currentMint ? `https://api.dexscreener.com/latest/dex/tokens/${currentMint}` : null,
    fetcher,
    {
      refreshInterval: 4_000,
      revalidateOnFocus: true,
      dedupingInterval: 2_000,
    }
  );

  const liveSelectedTokenPrice = React.useMemo(() => {
    const pairs = selectedPairData?.pairs || [];
    const bestPair = pairs[0];
    if (bestPair?.priceUsd) {
      return parseFloat(bestPair.priceUsd) || 0;
    }
    const match = liveTokensList.find((t) => t.ca.toLowerCase() === currentMint.toLowerCase());
    return match?.price || customTokenFound?.price || 0;
  }, [selectedPairData, currentMint, liveTokensList, customTokenFound]);

  const tokenPrice = liveSelectedTokenPrice;
  const parsedPayAmount = parseFloat(solAmount) || 0;

  // If normal swap (SOL -> Token): calculate tokens out
  // If reverse swap (Token -> SOL): calculate SOL out
  const estimatedOut = !isReverse
    ? parsedPayAmount > 0 && tokenPrice > 0
      ? (parsedPayAmount * solPrice) / tokenPrice
      : 0
    : parsedPayAmount > 0 && solPrice > 0
    ? (parsedPayAmount * tokenPrice) / solPrice
    : 0;

  const estimatedOutFormatted = !isReverse
    ? estimatedOut >= 1_000_000
      ? `${(estimatedOut / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`
      : estimatedOut >= 1_000
      ? `${(estimatedOut / 1_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}K`
      : estimatedOut.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    : estimatedOut.toFixed(4);

  const handleSelectToken = (token: TrendingTokenItem) => {
    setCurrentMint(token.ca);
    setCurrentSymbol(token.symbol);
    setCurrentName(token.name);
    setCurrentIcon(token.iconUrl || (token.ca === BATON_MINT ? BATON_DEFAULT_ICON : undefined));
    setSelectorOpen(false);
    setModalSearch("");
    setCustomTokenFound(null);
    if (onTokenChange) onTokenChange(token.ca, token.symbol);
  };

  const handleQuickAmount = (type: "0.1" | "0.5" | "1" | "half" | "max" | "25%" | "50%" | "75%") => {
    setErrorMsg(null);
    setTxSuccess(null);
    if (!isReverse) {
      const curBal = userBalance !== null ? userBalance : 0;
      if (type === "0.1") {
        setSolAmount("0.1");
      } else if (type === "0.5") {
        setSolAmount("0.5");
      } else if (type === "1") {
        setSolAmount("1.0");
      } else if (type === "half") {
        const spendable = Math.max(0, curBal - 0.0025);
        const halfBal = spendable > 0 ? (spendable / 2).toFixed(4) : "0.0";
        setSolAmount(halfBal);
      } else if (type === "max") {
        // Reserve 0.0025 SOL for ATA account rent (0.00204 SOL) and priority/network fees
        const maxBal = curBal > 0.003 ? (curBal - 0.0025).toFixed(4) : "0.0";
        setSolAmount(maxBal);
      }
    } else {
      const tb = tokenBalance || 0;
      if (type === "25%") setSolAmount(tb > 0 ? (tb * 0.25).toFixed(2) : "0");
      else if (type === "50%" || type === "half") setSolAmount(tb > 0 ? (tb * 0.5).toFixed(2) : "0");
      else if (type === "75%") setSolAmount(tb > 0 ? (tb * 0.75).toFixed(2) : "0");
      else if (type === "max" || type === "1") setSolAmount(tb > 0 ? tb.toFixed(2) : "0");
      else setSolAmount("0");
    }
  };

  // ── ON-DEMAND LIVE ON-CHAIN JUPITER TRANSACTION TRIGGER ────────────────────
  const handleExecuteSwap = async () => {
    setErrorMsg(null);
    setTxSuccess(null);

    // 1. Cüzdan kontrolü
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    const val = parseFloat(solAmount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg(`Please enter a valid ${!isReverse ? "SOL" : currentSymbol} amount.`);
      return;
    }

    const activeBalance = !isReverse ? userBalance : tokenBalance;
    if (activeBalance !== null && val > activeBalance) {
      setErrorMsg(`Insufficient ${!isReverse ? "SOL" : currentSymbol} balance in wallet.`);
      return;
    }

    try {
      setSwapping(true);

      // Single on-demand quote request
      const slippageParam = isAutoSlippage
        ? "autoSlippage=true"
        : `slippageBps=${Math.round(effectiveSlippage * 100)}`;

      const inputMint = !isReverse ? "So11111111111111111111111111111111111111112" : currentMint;
      const outputMint = !isReverse ? currentMint : "So11111111111111111111111111111111111111112";
      const decimalsParam = isReverse ? "&inputDecimals=6" : "";

      const quoteRes = await fetch(
        `/api/swap-quote?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${encodeURIComponent(val)}${decimalsParam}&${slippageParam}`
      );
      if (!quoteRes.ok) {
        const err = await quoteRes.json().catch(() => ({ error: "Quote error" }));
        throw new Error(err.error || "Route unavailable");
      }
      const quoteData = await quoteRes.json();
      if (!quoteData.rawQuote) {
        throw new Error("No route found for this pair.");
      }

      // Single on-demand serialized transaction generation
      const swapRes = await fetch("/api/jupiter/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quoteData.rawQuote,
          userPublicKey: publicKey.toBase58(),
        }),
      });

      if (!swapRes.ok) {
        const err = await swapRes.json().catch(() => ({ error: "Swap transaction error" }));
        throw new Error(err.error || "Failed to generate swap transaction.");
      }

      const { swapTransaction } = await swapRes.json();
      if (!swapTransaction) {
        throw new Error("No swapTransaction returned from router.");
      }

      // Decode & send transaction to wallet
      const txBytes = base64ToBytes(swapTransaction);
      const versionedTx = VersionedTransaction.deserialize(txBytes);

      let signature: string;
      if (sendTransaction) {
        try {
          signature = await sendTransaction(versionedTx, connection, {
            skipPreflight: true,
            maxRetries: 3,
          });
        } catch (walletErr: any) {
          const msg = walletErr?.message || String(walletErr);
          if (msg.includes("User rejected") || msg.includes("rejected") || msg.includes("cancelled")) {
            throw walletErr;
          }
          if (signTransaction) {
            const signedTx = await signTransaction(versionedTx);
            const rawTx = signedTx.serialize();
            try {
              signature = await connection.sendRawTransaction(rawTx, {
                skipPreflight: true,
                maxRetries: 3,
              });
            } catch {
              const b64 = Buffer.from(rawTx).toString("base64");
              const rpcRes = await fetch("https://solana-rpc.publicnode.com", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  id: "send-tx",
                  method: "sendTransaction",
                  params: [b64, { encoding: "base64", skipPreflight: true, maxRetries: 3 }],
                }),
              });
              const rpcJson = await rpcRes.json();
              if (rpcJson?.result) {
                signature = rpcJson.result;
              } else {
                throw new Error(rpcJson?.error?.message || "Failed to broadcast transaction.");
              }
            }
          } else {
            throw walletErr;
          }
        }
      } else if (signTransaction) {
        const signedTx = await signTransaction(versionedTx);
        const rawTx = signedTx.serialize();
        try {
          signature = await connection.sendRawTransaction(rawTx, {
            skipPreflight: true,
            maxRetries: 3,
          });
        } catch {
          const b64 = Buffer.from(rawTx).toString("base64");
          const rpcRes = await fetch("https://solana-rpc.publicnode.com", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "send-tx",
              method: "sendTransaction",
              params: [b64, { encoding: "base64", skipPreflight: true, maxRetries: 3 }],
            }),
          });
          const rpcJson = await rpcRes.json();
          if (rpcJson?.result) {
            signature = rpcJson.result;
          } else {
            throw new Error(rpcJson?.error?.message || "Failed to broadcast transaction.");
          }
        }
      } else {
        throw new Error("Wallet does not support transaction signing.");
      }

      // 4. Background transaction confirmation & instant balance refresh
      try {
        const latestBlockhash = await connection.getLatestBlockhash("confirmed");
        await connection.confirmTransaction(
          {
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          "confirmed"
        );
      } catch {
        // Transaction already broadcasted
      }

      setTxSuccess(signature);
      fetchLiveBalances();
      [500, 1500, 3000, 5000, 8000].forEach((delay) => {
        setTimeout(fetchLiveBalances, delay);
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("User rejected") || msg.includes("rejected") || msg.includes("cancelled")) {
        setErrorMsg("Transaction cancelled in wallet.");
      } else if (msg.includes("403") || msg.includes("Access forbidden") || msg.includes("forbidden")) {
        setErrorMsg("RPC rate limit encountered. Please try again with fallback route.");
      } else if (msg.includes("Simulation failed") || msg.includes("0x1")) {
        setErrorMsg("Slippage too low for volatile curve. Increase slippage to 20-25%.");
      } else {
        setErrorMsg(msg || "Swap execution failed.");
      }
    } finally {
      setSwapping(false);
    }
  };

  const filteredModalTokens = liveTokensList.filter((t) => {
    if (!modalSearch.trim()) return true;
    const q = modalSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.ca.toLowerCase().includes(q)
    );
  });

  const isInsufficientBalance =
    connected &&
    ((!isReverse && userBalance !== null && (parsedPayAmount + (userBalance > 0.005 ? 0.002 : 0.0015)) > userBalance) ||
     (isReverse && tokenBalance !== null && parsedPayAmount > tokenBalance));

  return (
    <>
      <div className="w-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-white/10 flex flex-col font-mono overflow-hidden shadow-2xl relative select-none">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-500 dark:text-amber-400 tracking-wide flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>TERMINAL QUICK SWAP</span>
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/5">
            LIVE JUPITER V6
          </span>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Box 1: Pay */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-center text-[11px] text-zinc-500 mb-1.5">
              <span>YOU PAY ({!isReverse ? "SOL" : currentSymbol})</span>
              {connected && (
                <span className="text-[10px]">
                  Balance:{" "}
                  <button
                    type="button"
                    onClick={() => handleQuickAmount("max")}
                    className="text-amber-500 hover:underline font-bold cursor-pointer"
                  >
                    {!isReverse
                      ? userBalance !== null
                        ? `${userBalance.toFixed(3)} SOL`
                        : "—"
                      : tokenBalance !== null
                      ? `${tokenBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currentSymbol}`
                      : "0"}
                  </button>
                </span>
              )}
            </div>

            <div className="flex justify-between items-center gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={solAmount}
                  onChange={(e) => {
                    setSolAmount(e.target.value.replace(/[^0-9.]/g, ""));
                    setErrorMsg(null);
                    setTxSuccess(null);
                  }}
                  placeholder="0.0"
                  className="bg-transparent text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 outline-none w-full placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-mono"
                />
                <span className="text-[11px] text-zinc-500 font-mono block">
                  ≈ ${(!isReverse ? parsedPayAmount * solPrice : parsedPayAmount * tokenPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
              {!isReverse ? (
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 px-2.5 py-1.5 rounded-xl shrink-0 shadow-sm">
                  <SolanaLogo className="w-4 h-4" />
                  <span className="text-xs font-bold text-amber-500">SOL</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectorOpen(true)}
                  className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/10 px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-sm"
                >
                  {currentIcon ? (
                    <img
                      src={currentIcon}
                      alt={currentSymbol}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold flex items-center justify-center shrink-0">
                      ${currentSymbol.slice(0, 1)}
                    </span>
                  )}
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">${currentSymbol}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {(!isReverse
                ? [
                    { label: "0.1 SOL", act: "0.1" as const, val: "0.1", num: 0.1 },
                    { label: "0.5 SOL", act: "0.5" as const, val: "0.5", num: 0.5 },
                    { label: "1.0 SOL", act: "1" as const, val: "1.0", num: 1.0 },
                    { label: "HALF", act: "half" as const, val: "half", num: 0 },
                    { label: "MAX", act: "max" as const, val: "max", num: 0 },
                  ]
                : [
                    { label: "25%", act: "25%" as const, val: "25%", num: 0 },
                    { label: "50%", act: "50%" as const, val: "50%", num: 0 },
                    { label: "75%", act: "75%" as const, val: "75%", num: 0 },
                    { label: "MAX", act: "max" as const, val: "max", num: 0 },
                  ]
              ).map((btn) => {
                const curBal = !isReverse ? (userBalance !== null ? userBalance : 0) : (tokenBalance || 0);
                const isFixed = "num" in btn && btn.num > 0;
                const isDisabled = connected && isFixed && curBal < btn.num;
                const isActive = !isReverse
                  ? solAmount === btn.val || (btn.val === "1.0" && solAmount === "1")
                  : false;

                return (
                  <button
                    key={btn.label}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleQuickAmount(btn.act)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all font-bold ${
                      isDisabled
                        ? "opacity-30 cursor-not-allowed border-zinc-200 dark:border-white/5 text-zinc-600 bg-transparent"
                        : isActive
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm cursor-pointer"
                        : "border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-200 cursor-pointer"
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Swap Direction Flip Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={() => {
                setIsReverse(!isReverse);
                setSolAmount(!isReverse ? "1000" : "0.5");
              }}
              title="Reverse Swap Direction"
              className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/20 active:scale-95 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md cursor-pointer hover:scale-110 transition-all group"
            >
              <ArrowUpDown className={`w-4 h-4 transition-transform duration-300 ${isReverse ? "rotate-180 text-amber-400" : "group-hover:rotate-180"}`} />
            </button>
          </div>

          {/* Box 2: Receive */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl p-3">
            <div className="flex justify-between items-center text-[11px] text-zinc-500 mb-1.5">
              <span>YOU RECEIVE (ESTIMATED)</span>
              <div className="flex items-center gap-1 font-bold text-[10px]">
                <span>Balance:</span>
                <span className="text-amber-500 dark:text-amber-400">
                  {!isReverse
                    ? tokenBalance !== null
                      ? `${tokenBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })} $${currentSymbol}`
                      : `0 $${currentSymbol}`
                    : userBalance !== null
                    ? `${userBalance.toFixed(3)} SOL`
                    : "0.000 SOL"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center min-h-[44px] gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-xl sm:text-2xl font-black text-emerald-500 dark:text-emerald-400 truncate block font-mono">
                  {parsedPayAmount > 0 ? `${estimatedOutFormatted}` : "0.00"}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono block">
                  ≈ ${(!isReverse ? estimatedOut * tokenPrice : estimatedOut * solPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>

              {!isReverse ? (
                <button
                  type="button"
                  onClick={() => setSelectorOpen(true)}
                  className="flex items-center gap-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg cursor-pointer shrink-0 transition-colors shadow-sm"
                >
                  {currentIcon ? (
                    <img
                      src={currentIcon}
                      alt={currentSymbol}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                      ${currentSymbol.slice(0, 1)}
                    </span>
                  )}
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    ${currentSymbol}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm">
                  <SolanaLogo className="w-4 h-4" />
                  <span className="text-xs font-bold text-amber-500">SOL</span>
                </div>
              )}
            </div>

            <div className="text-[10px] text-zinc-500 mt-1 flex justify-between">
              <span>
                Rate: 1 SOL ≈{" "}
                {tokenPrice > 0
                  ? ((1 * solPrice) / tokenPrice).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })
                  : "--"}{" "}
                ${currentSymbol}
              </span>
              <span>1 ${currentSymbol} = {tokenPrice > 0 ? (tokenPrice < 0.001 ? `$${tokenPrice.toFixed(8)}` : `$${tokenPrice.toFixed(4)}`) : "--"}</span>
            </div>
          </div>

          {/* Slippage Settings */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                SLIPPAGE TOLERANCE
              </span>
              <span className="font-bold text-amber-500 dark:text-amber-400">{effectiveSlippageLabel}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {/* Auto Dynamic Button */}
              <button
                type="button"
                onClick={() => {
                  setSlippageMode("auto");
                  setCustomSlippageVal("");
                }}
                className={`flex-1 min-w-[50px] text-[10px] py-1 px-2 rounded-lg border transition-colors cursor-pointer font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 ${
                  isAutoSlippage
                    ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
                    : "border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 text-zinc-500"
                }`}
              >
                <Zap className="w-2.5 h-2.5 fill-current" />
                <span>Auto</span>
              </button>

              {(["0.5", "1.0", "5.0"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setSlippageMode(val);
                    setCustomSlippageVal("");
                  }}
                  className={`text-[10px] py-1 px-2.5 rounded-lg border transition-colors cursor-pointer font-bold ${
                    slippageMode === val
                      ? "border-amber-500/50 bg-amber-500/20 text-amber-400"
                      : "border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 text-zinc-500"
                  }`}
                >
                  {val}%
                </button>
              ))}

              <div
                className={`flex-1 min-w-[65px] flex items-center border rounded-lg px-2 bg-white dark:bg-zinc-900 ${
                  isCustomSlippage ? "border-amber-500" : "border-zinc-200 dark:border-white/5"
                }`}
              >
                <input
                  type="text"
                  placeholder="Custom"
                  value={customSlippageVal}
                  onFocus={() => setSlippageMode("custom")}
                  onChange={(e) => {
                    setSlippageMode("custom");
                    setCustomSlippageVal(e.target.value.replace(/[^0-9.]/g, ""));
                  }}
                  className="w-full text-[10px] bg-transparent outline-none text-zinc-900 dark:text-zinc-100 font-mono"
                />
                <span className="text-[10px] text-zinc-500">%</span>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {txSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Transaction Submitted!</span>
              </div>
              <a
                href={`https://solscan.io/tx/${txSuccess}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[10px] text-emerald-300 flex items-center gap-1"
              >
                <span>View on Solscan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Execute Swap CTA Button */}
          <button
            type="button"
            onClick={handleExecuteSwap}
            disabled={swapping || parsedPayAmount <= 0 || isInsufficientBalance}
            className={`w-full py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
              !connected
                ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"
                : isInsufficientBalance
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-300 dark:border-white/5"
                : swapping
                ? "bg-amber-500/50 text-zinc-950 cursor-wait"
                : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-amber-500/25 active:scale-[0.99]"
            }`}
          >
            {swapping ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                <span>ROUTING &amp; SIGNING…</span>
              </>
            ) : !connected ? (
              <span>CONNECT WALLET TO SWAP</span>
            ) : isInsufficientBalance ? (
              <span>INSUFFICIENT {!isReverse ? "SOL" : currentSymbol} BALANCE</span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>{!isReverse ? `SWAP SOL FOR $${currentSymbol}` : `SWAP $${currentSymbol} FOR SOL`}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Token Selector Modal ────────────────────────────────────────── */}
      {selectorOpen && (
        <div
          onClick={() => setSelectorOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#0D0E12] border border-amber-500/30 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl relative cursor-default"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3">
              <span className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Select Output Token
              </span>
              <button
                type="button"
                onClick={() => setSelectorOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Search symbol, token name, or paste CA..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                autoFocus
              />
            </div>

            {/* Search results or Live list */}
            {(() => {
              const trimmed = modalSearch.trim();
              const tokenMap = new Map<string, TrendingTokenItem>();
              if (trimmed) {
                searchResults.forEach((t) => tokenMap.set(t.ca, t));
                filteredModalTokens.forEach((t) => {
                  if (!tokenMap.has(t.ca)) tokenMap.set(t.ca, t);
                });
              } else {
                liveTokensList.forEach((t) => tokenMap.set(t.ca, t));
              }
              const displayTokens = Array.from(tokenMap.values());

              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                      {trimmed ? `Search Results (${displayTokens.length})` : `Live Solana Tokens (${displayTokens.length})`}
                    </span>
                    {trimmed && (
                      <span className="text-[9px] text-amber-500 font-bold uppercase">
                        Sorted by Quality &amp; Volume
                      </span>
                    )}
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    {isSearchingCa && displayTokens.length === 0 ? (
                      <div className="py-8 text-center text-xs text-amber-500 flex flex-col items-center justify-center gap-2 font-mono">
                        <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span>Searching Solana tokens on DexScreener…</span>
                      </div>
                    ) : displayTokens.length === 0 ? (
                      <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                        {trimmed ? `No Solana token found matching "${trimmed}"` : "Loading live Solana tokens…"}
                      </div>
                    ) : (
                      displayTokens.map((t) => {
                        const isSelected = t.ca.toLowerCase() === currentMint.toLowerCase();
                        return (
                          <div
                            key={t.ca}
                            onClick={() => handleSelectToken(t)}
                            className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-amber-500/20 border border-amber-500/40"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                                {t.iconUrl ? (
                                  <img src={t.iconUrl} alt={t.symbol} className="w-full h-full object-cover" />
                                ) : (
                                  <span>${t.symbol.slice(0, 2)}</span>
                                )}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-zinc-950 dark:text-white block">
                                  ${t.symbol}
                                </span>
                                <span className="text-[10px] text-zinc-500 block truncate max-w-[150px]">
                                  {t.name}
                                </span>
                              </div>
                            </div>

                            <div className="text-right flex items-center gap-2">
                              <div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                                  {t.priceFormatted}
                                </span>
                                <span className="text-[10px] text-zinc-500 block">{t.mcapFormatted}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

export default QuickSwapCard;
