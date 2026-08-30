"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import {
  Search,
  ChevronDown,
  X,
  ExternalLink,
  Check,
  Zap,
  AlertCircle,
  Copy,
  Sliders,
  CheckCircle2,
  ArrowUpDown,
} from "lucide-react";

import { useMarketStats } from "@/hooks/useMarketData";
import { SolanaLogo } from "@/components/common/SolanaLogo";

interface JupiterSwapWidgetProps {
  outputMint?: string;
  outputSymbol?: string;
  targetMint?: string;
  targetSymbol?: string;
  defaultOutputMint?: string;
}

interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  iconUrl?: string;
  priceUsd?: number;
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

export function JupiterSwapWidget({
  outputMint,
  outputSymbol,
  targetMint,
  targetSymbol,
  defaultOutputMint,
}: JupiterSwapWidgetProps) {
  const initialMint =
    outputMint || targetMint || defaultOutputMint || "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
  const initialSymbol = outputSymbol || targetSymbol || "BATON";

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

  const liveTokenList: TokenInfo[] = React.useMemo(() => {
    const rawLiveTokens: any[] = trendingData?.tokens || trendingData?.data || [];
    return rawLiveTokens.map((t: any) => ({
      mint: t.mint || t.ca,
      symbol: t.symbol,
      name: t.name,
      iconUrl: t.iconUrl,
      priceUsd: t.priceUsd,
    }));
  }, [trendingData]);

  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
  const BATON_DEFAULT_ICON = "/images/baton-logo.png";

  // Selected Target Token State
  const [selectedToken, setSelectedToken] = useState<TokenInfo>({
    mint: initialMint,
    symbol: initialSymbol,
    name: initialSymbol,
    iconUrl: initialMint === BATON_MINT ? BATON_DEFAULT_ICON : undefined,
    priceUsd: 0,
  });

  // Sync with incoming prop changes
  useEffect(() => {
    const mintToSync = outputMint || targetMint || defaultOutputMint;
    if (mintToSync) {
      const match = liveTokenList.find(
        (t) => t.mint.toLowerCase() === mintToSync.toLowerCase()
      );
      if (match) {
        setSelectedToken({
          ...match,
          iconUrl: match.iconUrl || (match.mint === BATON_MINT ? BATON_DEFAULT_ICON : undefined),
        });
      } else {
        setSelectedToken((prev) => ({
          mint: mintToSync,
          symbol: outputSymbol || targetSymbol || prev.symbol,
          name: outputSymbol || targetSymbol || prev.name,
          iconUrl: mintToSync === BATON_MINT ? BATON_DEFAULT_ICON : prev.iconUrl,
          priceUsd: prev.mint.toLowerCase() === mintToSync.toLowerCase() ? prev.priceUsd : 0,
        }));
      }
    }
  }, [outputMint, targetMint, defaultOutputMint, outputSymbol, targetSymbol, liveTokenList]);

  // Continuously sync selectedToken price whenever trendingData updates live
  useEffect(() => {
    if (selectedToken.mint && liveTokenList.length > 0) {
      const match = liveTokenList.find(
        (t) => t.mint.toLowerCase() === selectedToken.mint.toLowerCase()
      );
      if (match && match.priceUsd && match.priceUsd !== selectedToken.priceUsd) {
        setSelectedToken((prev) => ({
          ...prev,
          priceUsd: match.priceUsd,
          name: match.name || prev.name,
          symbol: match.symbol || prev.symbol,
          iconUrl: match.iconUrl || prev.iconUrl,
        }));
      }
    }
  }, [liveTokenList, selectedToken.mint]);

  // Token Modal / Search state
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingCa, setIsSearchingCa] = useState(false);
  const [customTokenFound, setCustomTokenFound] = useState<TokenInfo | null>(null);

  // Swap input & execution state
  const [isReverse, setIsReverse] = useState(false);
  const [inputAmount, setInputAmount] = useState("0.5");
  const [swapping, setSwapping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [copiedCa, setCopiedCa] = useState(false);

  // Slippage Settings State (Auto Dynamic by default matching Jupiter official)
  const [slippageMode, setSlippageMode] = useState<"auto" | "0.5" | "1.0" | "5.0" | "custom">("auto");
  const [customSlippageVal, setCustomSlippageVal] = useState("");

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

  // Live user SOL & SPL token balance
  useEffect(() => {
    let isMounted = true;
    async function fetchBalances() {
      if (connected && publicKey) {
        // 1. SOL Balance
        try {
          if (connection) {
            const lamports = await connection.getBalance(publicKey, "confirmed");
            if (isMounted && typeof lamports === "number") {
              setUserBalance(lamports / 1e9);
            }
          }
        } catch {
          // Ignore
        }

        // 2. Token Balance
        try {
          if (connection && selectedToken.mint && selectedToken.mint !== "So11111111111111111111111111111111111111112") {
            const { PublicKey } = await import("@solana/web3.js");
            const resp = await connection.getParsedTokenAccountsByOwner(publicKey, {
              mint: new PublicKey(selectedToken.mint),
            });
            if (isMounted) {
              const accounts = resp.value || [];
              if (accounts.length > 0) {
                const amt = accounts[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
                setTokenBalance(amt);
              } else {
                setTokenBalance(0);
              }
            }
          }
        } catch {
          if (isMounted) setTokenBalance(0);
        }
      } else {
        if (isMounted) {
          setUserBalance(null);
          setTokenBalance(null);
        }
      }
    }

    fetchBalances();
    const interval = setInterval(fetchBalances, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [connected, publicKey, selectedToken.mint, connection]);

  const solPrice = liveSolPrice || 106.5;

  const parsedPayAmount = parseFloat(inputAmount) || 0;
  const tokenPrice = selectedToken.priceUsd && selectedToken.priceUsd > 0 ? selectedToken.priceUsd : 0.00001148;

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

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setCustomTokenFound(null);
      setIsSearchingCa(false);
      return;
    }

    const symbolMatch = liveTokenList.find(
      (t) =>
        t.mint.toLowerCase() === trimmed.toLowerCase() ||
        t.symbol.toLowerCase() === trimmed.toLowerCase() ||
        t.name.toLowerCase().includes(trimmed.toLowerCase())
    );
    if (symbolMatch) {
      setCustomTokenFound(symbolMatch);
      setIsSearchingCa(false);
      return;
    }

    if (trimmed.length >= 32 && trimmed.length <= 44 && !/\s/.test(trimmed)) {
      let isCurrent = true;
      setIsSearchingCa(true);

      const ctrl = new AbortController();

      fetch(`/api/token-lookup?mint=${encodeURIComponent(trimmed)}`, {
        signal: ctrl.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Lookup error");
          const data = await res.json();
          if (!isCurrent) return;

          if (data && data.mint) {
            setCustomTokenFound({
              mint: data.mint,
              symbol: data.symbol || "TOKEN",
              name: data.name || "Solana Token",
              iconUrl: data.iconUrl || (data.mint === BATON_MINT ? BATON_DEFAULT_ICON : undefined),
              priceUsd: data.priceUsd || 0,
            });
          }
        })
        .catch(() => {
          if (isCurrent) {
            setCustomTokenFound({
              mint: trimmed,
              symbol: `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`,
              name: "Solana Token",
              priceUsd: 0,
            });
          }
        })
        .finally(() => {
          if (isCurrent) setIsSearchingCa(false);
        });

      return () => {
        isCurrent = false;
        ctrl.abort();
      };
    } else {
      setCustomTokenFound(null);
      setIsSearchingCa(false);
    }
  }, [searchQuery, liveTokenList]);

  const selectTargetToken = (token: TokenInfo) => {
    setSelectedToken({
      ...token,
      iconUrl: token.iconUrl || (token.mint === BATON_MINT ? BATON_DEFAULT_ICON : undefined),
    });
    setSelectorOpen(false);
    setSearchQuery("");
    setCustomTokenFound(null);
    setErrorMsg(null);
    setTxSuccess(null);
  };

  const handleAmountChange = (val: string) => {
    const sanitized = val.replace(",", ".").replace(/[^0-9.]/g, "");
    setInputAmount(sanitized);
    setErrorMsg(null);
    setTxSuccess(null);
  };

  const handleCopyCa = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && selectedToken.mint) {
      navigator.clipboard.writeText(selectedToken.mint);
      setCopiedCa(true);
      setTimeout(() => setCopiedCa(false), 2000);
    }
  };

  const handleQuickAmount = (type: "0.1" | "0.5" | "1" | "half" | "max" | "25%" | "50%" | "75%") => {
    setErrorMsg(null);
    if (!isReverse) {
      if (type === "0.1") setInputAmount("0.1");
      else if (type === "0.5") setInputAmount("0.5");
      else if (type === "1") setInputAmount("1.0");
      else if (type === "half") {
        const halfBal = userBalance ? (userBalance / 2).toFixed(3) : "0.5";
        setInputAmount(halfBal);
      } else if (type === "max") {
        const maxBal = userBalance ? Math.max(0, userBalance - 0.005).toFixed(3) : "1.0";
        setInputAmount(maxBal);
      }
    } else {
      const tb = tokenBalance || 0;
      if (type === "25%") setInputAmount((tb * 0.25).toFixed(2));
      else if (type === "50%" || type === "half") setInputAmount((tb * 0.5).toFixed(2));
      else if (type === "75%") setInputAmount((tb * 0.75).toFixed(2));
      else if (type === "max" || type === "1") setInputAmount(tb.toFixed(2));
      else setInputAmount("1000");
    }
  };

  const handleExecuteSwap = async () => {
    setErrorMsg(null);
    setTxSuccess(null);

    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    const val = parseFloat(inputAmount);
    if (isNaN(val) || val <= 0) {
      setErrorMsg(`Please enter a valid ${!isReverse ? "SOL" : selectedToken.symbol} amount.`);
      return;
    }

    const activeBalance = !isReverse ? userBalance : tokenBalance;
    if (activeBalance !== null && val > activeBalance) {
      setErrorMsg(`Insufficient ${!isReverse ? "SOL" : selectedToken.symbol} balance in wallet.`);
      return;
    }

    try {
      setSwapping(true);

      const slippageParam = isAutoSlippage
        ? "autoSlippage=true"
        : `slippageBps=${Math.round(effectiveSlippage * 100)}`;

      const inputMint = !isReverse ? "So11111111111111111111111111111111111111112" : selectedToken.mint;
      const outputMint = !isReverse ? selectedToken.mint : "So11111111111111111111111111111111111111112";
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

      const swapRes = await fetch("/api/jupiter/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quoteData.rawQuote,
          userPublicKey: publicKey.toBase58(),
        }),
      });

      if (!swapRes.ok) {
        const swapErr = await swapRes.json().catch(() => ({ error: "Swap error" }));
        throw new Error(swapErr.error || swapErr.details || "Failed to generate swap transaction");
      }

      const swapData = await swapRes.json();
      const swapTransaction = swapData.swapTransaction;
      if (!swapTransaction) {
        throw new Error("No swap transaction returned by Jupiter.");
      }

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
      } catch {}

      setTxSuccess(signature);
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

  const isInsufficientBalance =
    connected &&
    ((!isReverse && userBalance !== null && parsedPayAmount > userBalance) ||
     (isReverse && tokenBalance !== null && parsedPayAmount > tokenBalance));

  return (
    <>
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl relative font-mono select-none">
      <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-xs font-black tracking-wider text-zinc-950 dark:text-white uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
            <span>Terminal Swap Engine</span>
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
          LIVE JUPITER V6
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="font-bold">YOU PAY ({!isReverse ? "SOL" : selectedToken.symbol})</span>
            <div className="flex items-center gap-1 font-bold">
              <span>Balance:</span>
              <span className="text-amber-500 dark:text-amber-400">
                {!isReverse
                  ? userBalance !== null
                    ? `${userBalance.toFixed(3)} SOL`
                    : "—"
                  : tokenBalance !== null
                  ? `${tokenBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${selectedToken.symbol}`
                  : "0"}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={inputAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.0"
                className="bg-transparent text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 outline-none w-full font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
              <span className="text-[11px] text-zinc-500 font-mono block">
                ≈ ${(!isReverse ? parsedPayAmount * solPrice : parsedPayAmount * tokenPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            {!isReverse ? (
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 px-2.5 py-1.5 rounded-xl shrink-0 shadow-sm">
                <SolanaLogo className="w-4 h-4" />
                <span className="text-xs font-bold text-amber-500 dark:text-amber-400">SOL</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSelectorOpen(true)}
                className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-white/10 px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
                  {selectedToken.iconUrl ? (
                    <img
                      src={selectedToken.iconUrl}
                      alt={selectedToken.symbol}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>${selectedToken.symbol.slice(0, 2)}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  ${selectedToken.symbol}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {(!isReverse
              ? [
                  { label: "0.1 SOL", act: "0.1" as const },
                  { label: "0.5 SOL", act: "0.5" as const },
                  { label: "1.0 SOL", act: "1" as const },
                  { label: "HALF", act: "half" as const },
                  { label: "MAX", act: "max" as const },
                ]
              : [
                  { label: "25%", act: "25%" as const },
                  { label: "50%", act: "50%" as const },
                  { label: "75%", act: "75%" as const },
                  { label: "MAX", act: "max" as const },
                ]
            ).map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => handleQuickAmount(btn.act)}
                className="text-[10px] px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer font-bold"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Swap Direction Flip Divider ────────────────────────────── */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            type="button"
            onClick={() => {
              setIsReverse(!isReverse);
              setInputAmount(!isReverse ? "1000" : "0.5");
            }}
            title="Reverse Swap Direction"
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/20 active:scale-95 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md cursor-pointer hover:scale-110 transition-all group"
          >
            <ArrowUpDown className={`w-4 h-4 transition-transform duration-300 ${isReverse ? "rotate-180 text-amber-400" : "group-hover:rotate-180"}`} />
          </button>
        </div>

        {/* ── Input 2: YOU RECEIVE ────────────────────────── */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-2xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="font-bold">YOU RECEIVE (ESTIMATED)</span>
            <div className="flex items-center gap-1 font-bold">
              <span>Balance:</span>
              <span className="text-amber-500 dark:text-amber-400">
                {!isReverse
                  ? tokenBalance !== null
                    ? `${tokenBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })} $${selectedToken.symbol}`
                    : "0.00"
                  : userBalance !== null
                  ? `${userBalance.toFixed(3)} SOL`
                  : "0.000 SOL"}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 min-h-[44px]">
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
                className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 border border-zinc-200 dark:border-white/10 px-2.5 py-1.5 rounded-xl shrink-0 transition-colors cursor-pointer group shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
                  {selectedToken.iconUrl ? (
                    <img
                      src={selectedToken.iconUrl}
                      alt={selectedToken.symbol}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>${selectedToken.symbol.slice(0, 2)}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  ${selectedToken.symbol}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 px-2.5 py-1.5 rounded-lg shrink-0 shadow-sm">
                <SolanaLogo className="w-4 h-4" />
                <span className="text-xs font-bold text-amber-500">SOL</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-white/5 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span>
                Rate: 1 SOL ≈{" "}
                {tokenPrice > 0
                  ? (solPrice / tokenPrice).toLocaleString("en-US", { maximumFractionDigits: 0 })
                  : "--"}{" "}
                ${selectedToken.symbol}
              </span>
              <span>
                1 ${selectedToken.symbol} = {tokenPrice > 0 ? (tokenPrice < 0.001 ? `$${tokenPrice.toFixed(8)}` : `$${tokenPrice.toFixed(4)}`) : "--"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span>CA:</span>
                <span className="font-mono text-zinc-600 dark:text-zinc-400">
                  {selectedToken.mint.slice(0, 4)}…{selectedToken.mint.slice(-4)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCa}
                  className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer"
                  title="Copy Token CA"
                >
                  {copiedCa ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              <a
                href={`https://solscan.io/token/${selectedToken.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <span>Solscan</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-bold">
              <Sliders className="w-3 h-3 text-zinc-400" />
              SLIPPAGE TOLERANCE
            </span>
            <span className="text-amber-500 dark:text-amber-400 font-mono font-bold">
              {effectiveSlippageLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Auto Dynamic Button */}
            <button
              type="button"
              onClick={() => {
                setSlippageMode("auto");
                setCustomSlippageVal("");
              }}
              className={`flex-1 min-w-[50px] text-[10px] py-1 px-2 rounded border transition-colors cursor-pointer font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 ${
                isAutoSlippage
                  ? "border-amber-500/50 bg-amber-500/20 text-amber-500 dark:text-amber-400"
                  : "border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
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
                className={`text-[10px] py-1 px-2 rounded border transition-colors cursor-pointer font-bold ${
                  slippageMode === val
                    ? "border-amber-500/50 bg-amber-500/20 text-amber-500 dark:text-amber-400 font-bold"
                    : "border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {val}%
              </button>
            ))}

            <div
              className={`flex-1 min-w-[65px] flex items-center border rounded px-1.5 py-0.5 bg-white dark:bg-zinc-900 ${
                isCustomSlippage
                  ? "border-amber-500/50"
                  : "border-zinc-200 dark:border-white/5"
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
                className="w-full text-[10px] bg-transparent outline-none text-zinc-900 dark:text-zinc-100 font-mono placeholder:text-zinc-600"
              />
              <span className="text-[10px] text-zinc-500">%</span>
            </div>
          </div>
        </div>

        {/* ── Feedback Banners ─────────────────────────────────────────── */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {txSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Swap Successful!</span>
              <a
                href={`https://solscan.io/tx/${txSuccess}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[10px] text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1 mt-0.5"
              >
                View on Solscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

          {/* ── Swap Action Button ───────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleExecuteSwap}
            disabled={swapping || isInsufficientBalance}
            className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              !connected
                ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"
                : isInsufficientBalance
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-300 dark:border-white/5"
                : swapping
                ? "bg-amber-500/50 text-zinc-950 cursor-wait"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-amber-500/25 active:scale-[0.99]"
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
              <span>INSUFFICIENT {!isReverse ? "SOL" : selectedToken.symbol} BALANCE</span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>{!isReverse ? `SWAP SOL FOR $${selectedToken.symbol}` : `SWAP $${selectedToken.symbol} FOR SOL`}</span>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, token name, or paste CA..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none font-mono"
                autoFocus
              />
            </div>

            {/* Loading state during CA lookup */}
            {isSearchingCa && (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-xs text-amber-500">
                <span className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span>Fetching live DexScreener token metadata…</span>
              </div>
            )}

            {/* Custom token search result */}
            {!isSearchingCa && customTokenFound && (
              <button
                type="button"
                onClick={() => selectTargetToken(customTokenFound)}
                className="w-full p-3 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 rounded-xl flex items-center justify-between cursor-pointer transition-all text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 text-xs font-bold text-amber-400">
                    {customTokenFound.iconUrl ? (
                      <img
                        src={customTokenFound.iconUrl}
                        alt={customTokenFound.symbol}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>${customTokenFound.symbol.slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-zinc-950 dark:text-white block group-hover:text-amber-400 transition-colors truncate">
                      ${customTokenFound.symbol}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {customTokenFound.name}
                    </span>
                    <span className="text-[9px] text-zinc-500 block font-mono">
                      {customTokenFound.mint.slice(0, 6)}…{customTokenFound.mint.slice(-6)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-extrabold px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 uppercase tracking-wider shadow-sm group-hover:scale-105 transition-transform">
                    Select
                  </span>
                </div>
              </button>
            )}

            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                Live Solana Tokens ({liveTokenList.length})
              </span>
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {liveTokenList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    Loading live Solana tokens from DexScreener…
                  </div>
                ) : (
                  liveTokenList.map((token) => (
                    <div
                      key={token.mint}
                      onClick={() => selectTargetToken(token)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900/80 cursor-pointer transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {token.iconUrl ? (
                          <img
                            src={token.iconUrl}
                            alt={token.symbol}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-zinc-800 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                            $
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block truncate">
                            ${token.symbol}
                          </span>
                          <span className="text-[10px] text-zinc-500 truncate block">
                            {token.name}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-zinc-500 font-mono">
                        {token.mint.slice(0, 4)}…{token.mint.slice(-4)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default JupiterSwapWidget;
