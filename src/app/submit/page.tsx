"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PublicKey } from "@solana/web3.js";
import { Ticker } from "@/components/Ticker";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TierBadge } from "@/components/TierBadge";
import {
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
  Send,
  Flame,
  Sparkles,
  ShieldCheck,
  Globe,
  FileText,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

// Zod Validation Schema in English
const submitFormSchema = z.object({
  name: z
    .string()
    .min(2, "Token name must be at least 2 characters.")
    .max(32, "Token name cannot exceed 32 characters."),
  ticker: z
    .string()
    .min(2, "Token ticker must be at least 2 characters.")
    .max(10, "Token ticker cannot exceed 10 characters.")
    .regex(/^[a-zA-Z0-9$]+$/, "Ticker can only contain letters, numbers, or $."),
  mintAddress: z
    .string()
    .min(32, "Solana Mint address must be at least 32 characters.")
    .max(44, "Solana Mint address cannot exceed 44 characters.")
    .refine((val) => {
      try {
        new PublicKey(val.trim());
        return true;
      } catch {
        return false;
      }
    }, "Invalid Solana PublicKey (CA) format."),
  telegram: z.string().optional(),
  twitter: z.string().optional(),
  description: z
    .string()
    .max(280, "Description cannot exceed 280 characters.")
    .optional(),
});

type SubmitFormData = z.infer<typeof submitFormSchema>;

export default function SubmitCoinPage() {
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [dexVerified, setDexVerified] = useState<boolean | null>(null);
  const [dexPairData, setDexPairData] = useState<{
    priceUsd?: string;
    marketCap?: number;
    dexId?: string;
    imageUrl?: string;
  } | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submissionId, setSubmissionId] = useState<string>("");
  const [telegramNotified, setTelegramNotified] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<SubmitFormData>({
    resolver: zodResolver(submitFormSchema),
    defaultValues: {
      name: "",
      ticker: "",
      mintAddress: "",
      telegram: "",
      twitter: "",
      description: "",
    },
  });

  const formValues = watch();
  const descLength = formValues.description ? formValues.description.length : 0;

  // Verify Mint Address via DexScreener Public API
  const handleVerifyMint = async (mint: string) => {
    if (!mint || mint.length < 32) return;

    try {
      new PublicKey(mint.trim());
    } catch {
      return;
    }

    setIsVerifying(true);
    setDexVerified(null);
    setDexPairData(null);
    setServerError(null);

    try {
      const res = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${mint.trim()}`
      );
      if (res.ok) {
        const data = await res.json();
        const pairs = data.pairs || [];
        const solanaPair = pairs.find(
          (p: { chainId: string }) => p.chainId === "solana"
        );

        if (solanaPair) {
          setDexVerified(true);
          setDexPairData({
            priceUsd: solanaPair.priceUsd,
            marketCap: solanaPair.marketCap || solanaPair.fdv,
            dexId: solanaPair.dexId,
            imageUrl: solanaPair.info?.imageUrl,
          });

          // Auto-fill name & ticker if empty
          if (!formValues.name && solanaPair.baseToken?.name) {
            setValue("name", solanaPair.baseToken.name);
          }
          if (!formValues.ticker && solanaPair.baseToken?.symbol) {
            setValue("ticker", solanaPair.baseToken.symbol);
          }
        } else {
          setDexVerified(false);
        }
      } else {
        setDexVerified(false);
      }
    } catch {
      setDexVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: SubmitFormData) => {
    setIsVerifying(true);
    setServerError(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          ticker: data.ticker.trim(),
          mintAddress: data.mintAddress.trim(),
          twitter: data.twitter?.trim() || "",
          telegram: data.telegram?.trim() || "",
          description: data.description?.trim() || "",
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSubmissionId(json.submissionId || `SUB-${Date.now().toString(36).toUpperCase()}`);
        setTelegramNotified(json.telegramSent ?? false);
        setSubmitSuccess(true);
        reset();
      } else {
        throw new Error(json.error || "Submission could not be completed.");
      }
    } catch (err: unknown) {
      console.error("Submission error:", err);
      const msg = err instanceof Error ? err.message : "An error occurred during submission. Please try again.";
      setServerError(msg);
      setError("mintAddress", { message: msg });
    } finally {
      setIsVerifying(false);
    }
  };

  const tickerClean = formValues.ticker
    ? formValues.ticker.replace(/^\$/, "").toUpperCase()
    : "TICKER";

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text selection:bg-acid selection:text-bg">
      <Ticker />
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-acid/30 bg-acid/10 text-acid font-mono text-xs font-bold uppercase tracking-wider">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>SOLANA COMMUNITY APPLICATION</span>
          </div>

          <h1 className="font-archivo text-3xl sm:text-5xl text-text tracking-tight uppercase leading-tight">
            LIST YOUR <span className="text-acid">MASCOT COIN</span>
          </h1>

          <p className="font-space text-sm sm:text-base text-text-dim leading-relaxed">
            Submit your Solana mascot token to the official directory. Once approved, rally your community to burn $BATON and reach the Diamond League spotlight.
          </p>
        </div>

        {submitSuccess ? (
          /* Success Screen */
          <div className="p-8 sm:p-12 rounded-3xl border border-acid/40 bg-bg-card text-center space-y-6 max-w-xl mx-auto font-mono shadow-[0_0_40px_rgba(212,255,63,0.15)] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-acid/15 border border-acid/40 text-acid mx-auto flex items-center justify-center shadow-[0_0_25px_rgba(212,255,63,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-archivo text-2xl sm:text-3xl text-text uppercase">
                ✓ APPLICATION SUBMITTED!
              </h2>
              <p className="text-xs text-text-dim font-space">
                Your token submission has been received and added to the review queue.
              </p>
              {telegramNotified && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-up/10 border border-up/20 text-up text-[11px] font-bold">
                  <Send className="w-3 h-3" />
                  <span>Telegram Notification Dispatched to Team</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-bg-raised border border-line text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-text-faint">Submission ID:</span>
                <span className="text-text font-bold">{submissionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint">Initial Tier:</span>
                <TierBadge level="none" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="flex-1 py-3 rounded-xl border border-line bg-bg-raised text-text-dim hover:text-text text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Submit Another</span>
              </button>
              <Link
                href="/leaderboard"
                className="flex-1 py-3 rounded-xl bg-acid text-bg text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(212,255,63,0.3)] hover:bg-acid-dim transition-all flex items-center justify-center gap-1.5"
              >
                <span>Leaderboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Form & Live Preview Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <div className="lg:col-span-7 rounded-3xl border border-line bg-bg-card p-6 sm:p-8 space-y-6 shadow-xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* 1. Mint Address (With DexScreener Verification) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-text uppercase tracking-wider">
                      Solana Mint Address / CA <span className="text-magenta">*</span>
                    </label>
                    {isVerifying && (
                      <span className="text-[11px] font-mono text-acid flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Verifying...</span>
                      </span>
                    )}
                    {!isVerifying && dexVerified === true && (
                      <span className="text-[11px] font-mono text-up flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>DexScreener Verified</span>
                      </span>
                    )}
                    {!isVerifying && dexVerified === false && (
                      <span className="text-[11px] font-mono text-down flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Pool Not Found</span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      {...register("mintAddress")}
                      placeholder="e.g. 2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump"
                      onBlur={(e) => handleVerifyMint(e.target.value)}
                      className={`w-full bg-bg-raised border rounded-xl px-3.5 py-3 font-mono text-xs text-text placeholder:text-text-faint focus:outline-none transition-all ${
                        errors.mintAddress
                          ? "border-down focus:border-down"
                          : "border-line focus:border-acid focus:shadow-[0_0_15px_rgba(212,255,63,0.15)]"
                      }`}
                    />
                  </div>
                  {errors.mintAddress && (
                    <p className="text-[11px] font-mono text-down">
                      {errors.mintAddress.message}
                    </p>
                  )}
                  {dexPairData && (
                    <div className="p-2.5 rounded-lg bg-bg-raised border border-line text-[11px] font-mono flex items-center justify-between">
                      <span className="text-text-dim">DEX: {dexPairData.dexId?.toUpperCase()}</span>
                      {dexPairData.priceUsd && (
                        <span className="text-acid font-bold">
                          Price: ${dexPairData.priceUsd}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Token Name & Ticker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-text uppercase tracking-wider">
                      Token Name <span className="text-magenta">*</span>
                    </label>
                    <input
                      {...register("name")}
                      placeholder="e.g. Baton Corporation"
                      className={`w-full bg-bg-raised border rounded-xl px-3.5 py-2.5 font-space text-xs text-text placeholder:text-text-faint focus:outline-none transition-all ${
                        errors.name
                          ? "border-down focus:border-down"
                          : "border-line focus:border-acid focus:shadow-[0_0_15px_rgba(212,255,63,0.15)]"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-[11px] font-mono text-down">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-text uppercase tracking-wider">
                      Token Ticker <span className="text-magenta">*</span>
                    </label>
                    <input
                      {...register("ticker")}
                      placeholder="e.g. BATON"
                      className={`w-full bg-bg-raised border rounded-xl px-3.5 py-2.5 font-mono text-xs text-text uppercase placeholder:text-text-faint focus:outline-none transition-all ${
                        errors.ticker
                          ? "border-down focus:border-down"
                          : "border-line focus:border-acid focus:shadow-[0_0_15px_rgba(212,255,63,0.15)]"
                      }`}
                    />
                    {errors.ticker && (
                      <p className="text-[11px] font-mono text-down">
                        {errors.ticker.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Twitter / X and Telegram Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-text-dim" />
                      <span>X Profile Link</span>
                    </label>
                    <input
                      {...register("twitter")}
                      placeholder="https://x.com/coin"
                      className="w-full bg-bg-raised border border-line rounded-xl px-3.5 py-2.5 font-mono text-xs text-text placeholder:text-text-faint focus:border-acid focus:shadow-[0_0_15px_rgba(212,255,63,0.15)] focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-text-dim" />
                      <span>Telegram Link</span>
                    </label>
                    <input
                      {...register("telegram")}
                      placeholder="https://t.me/coin"
                      className="w-full bg-bg-raised border border-line rounded-xl px-3.5 py-2.5 font-mono text-xs text-text placeholder:text-text-faint focus:border-acid focus:shadow-[0_0_15px_rgba(212,255,63,0.15)] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 4. Short Description with Live Character Counter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-text-dim" />
                      <span>Short Description</span>
                    </label>
                    <span className="font-mono text-[11px] text-text-faint">
                      {descLength} / 280
                    </span>
                  </div>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Brief summary about your mascot token and community..."
                    className="w-full bg-bg-raised border border-line rounded-xl px-3.5 py-2.5 font-space text-xs text-text placeholder:text-text-faint focus:border-acid focus:shadow-[0_0_15px_rgba(212,255,63,0.15)] focus:outline-none transition-all resize-none"
                  />
                  {errors.description && (
                    <p className="text-[11px] font-mono text-down">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {serverError && (
                  <div className="p-3 rounded-xl border border-down/40 bg-down/10 text-down text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-4 rounded-2xl bg-acid text-bg font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(212,255,63,0.3)] hover:bg-acid-dim active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying &amp; Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>Submit Mascot Coin 🚀</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase text-text-dim flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-acid" />
                  <span>Live Card Preview</span>
                </span>
                <span className="text-[11px] font-mono text-text-faint">
                  Directory View
                </span>
              </div>

              {/* Live Form Coin Card Preview */}
              <div className="rounded-2xl border border-line bg-bg-card p-5 space-y-4 shadow-2xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-archivo text-base font-bold bg-magenta/20 text-magenta border border-magenta/40 shadow-inner">
                      {tickerClean.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-archivo text-base text-text truncate">
                        {formValues.name || "Token Name"}
                      </h3>
                      <div className="font-mono text-xs text-text-dim">
                        ${tickerClean}
                      </div>
                    </div>
                  </div>

                  <TierBadge level="none" />
                </div>

                <div className="p-3 rounded-xl bg-bg-raised/70 border border-line/60 font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-faint text-[11px]">Market Cap:</span>
                    <span className="font-bold text-text font-mono-num">
                      {dexPairData?.marketCap
                        ? `$${dexPairData.marketCap.toLocaleString()}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-faint text-[11px]">Burned $BATON:</span>
                    <span className="font-bold text-acid font-mono-num">
                      0 $BATON
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-xl bg-bg-raised border border-acid/30 text-acid font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 opacity-80"
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>Burn &amp; Boost</span>
                </button>
              </div>

              {/* Listing Guidelines */}
              <div className="p-4 rounded-2xl border border-dashed border-line bg-bg-raised/60 space-y-2 text-xs font-mono text-text-faint">
                <div className="flex items-center gap-1.5 text-text font-bold">
                  <ShieldCheck className="w-4 h-4 text-acid" />
                  <span>$BATON Listing Guidelines</span>
                </div>
                <p className="leading-relaxed font-space">
                  Tokens with verified bonding curves or DEX liquidity are approved promptly. Community burns directly determine position in the directory.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
