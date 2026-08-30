"use client";

import React, { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { CalloutItem, CommentItem } from "@/types/token";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SetUsernameModal } from "@/components/modals/SetUsernameModal";
import {
  MessageSquare,
  X,
  ThumbsUp,
  TrendingUp,
  Flame,
  Send,
  Sparkles,
  ShieldCheck,
  Zap,
  Wallet,
  AlertCircle,
} from "lucide-react";

interface CalloutDiscussionModalProps {
  callout: CalloutItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CalloutDiscussionModal({
  callout,
  isOpen,
  onClose,
}: CalloutDiscussionModalProps) {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    username,
    walletAddress,
    isUsernameModalOpen,
    openUsernameModal,
    closeUsernameModal,
    claimUsername,
  } = useUserProfile();

  const [newCommentText, setNewCommentText] = useState("");
  const [sentiment, setSentiment] = useState<"BULLISH" | "BEARISH">("BULLISH");
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Liked comments local state for reactive toggles
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [commentLikesDelta, setCommentLikesDelta] = useState<Record<string, number>>({});

  // SWR for live comments
  const commentsApiUrl = callout ? `/api/callouts/comments?calloutId=${callout.id}` : null;
  const { data: commentsData, mutate: refreshComments } = useSWR(
    commentsApiUrl,
    fetcher,
    {
      refreshInterval: 10_000,
      revalidateOnFocus: true,
    }
  );

  const commentsList: CommentItem[] = commentsData?.comments || [];

  if (!isOpen || !callout) return null;

  const handleToggleLikeComment = (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedComments[commentId] || false;
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !isCurrentlyLiked,
    }));
    setCommentLikesDelta((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (isCurrentlyLiked ? -1 : 1),
    }));
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    if (!username) {
      openUsernameModal();
      return;
    }

    if (!newCommentText.trim()) return;

    try {
      setIsPosting(true);
      const res = await fetch("/api/callouts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calloutId: callout.id,
          walletAddress: publicKey.toBase58(),
          username: username,
          commentText: newCommentText.trim(),
          sentiment,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to post comment");
      }

      setNewCommentText("");
      refreshComments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || "Could not post comment.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0D0E12] border border-amber-500/30 rounded-3xl w-full max-w-xl p-5 sm:p-7 space-y-4 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        >
          {/* Top Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* ── Modal Header: Callout Summary ─────────────────────────────── */}
          <div className="flex items-start justify-between border-b border-zinc-200 dark:border-white/10 pb-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 font-black flex items-center justify-center text-xs shrink-0 shadow-md">
                {callout.callerAvatar}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-zinc-950 dark:text-white">
                    ${callout.tokenSymbol} Discussion
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    +{Math.round((callout.multiplier - 1) * 100)}% ({callout.multiplier}x)
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 block truncate">
                  Callout by {callout.callerName} (@{callout.callerHandle}) · {callout.timeAgo}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Callout Original Thesis Box ────────────────────────────────── */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 space-y-1 shrink-0 text-xs">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
              <span>Original Alpha Thesis</span>
              <span>Entry MC: {formatCurrency(callout.entryMcap)}</span>
            </div>
            <p className="text-zinc-800 dark:text-zinc-200 italic font-mono leading-relaxed">
              &ldquo;{callout.thesis}&rdquo;
            </p>
          </div>

          {/* ── Community Comments Thread List (Scrollable) ───────────────── */}
          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-72 min-h-[140px]">
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1 font-bold">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>Community Comments ({commentsList.length})</span>
              </span>
            </div>

            {commentsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                No comments posted yet. Connect wallet and share your alpha view!
              </div>
            ) : (
              commentsList.map((c) => {
                const isLiked = likedComments[c.id] || false;
                const totalLikes = Math.max(0, (c.upvotes || 0) + (commentLikesDelta[c.id] || 0));
                const isBull = c.sentiment === "BULLISH";

                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 space-y-1.5 text-xs"
                  >
                    {/* Author Info & Sentiment Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {c.authorAvatar || "DG"}
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {c.authorName}
                        </span>
                        {c.authorBadge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-mono shrink-0">
                            {c.authorBadge}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            isBull
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {c.sentiment}
                        </span>
                        <span className="text-[10px] text-zinc-500">{c.timeAgo}</span>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <p className="text-zinc-700 dark:text-zinc-300 font-mono leading-relaxed pl-8">
                      {c.commentText}
                    </p>

                    {/* Upvote Row */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleLikeComment(c.id, e)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer font-bold ${
                          isLiked
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm"
                            : "bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-500/10 text-zinc-500 hover:text-amber-400 border-zinc-200 dark:border-white/5"
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
                        <span>{totalLikes}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Error Banner ──────────────────────────────────────────────── */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── Bottom: Sentiment Selector & Comment Input Form ─────────────── */}
          <div className="pt-2 border-t border-zinc-200 dark:border-white/10 shrink-0 space-y-2">
            {!connected ? (
              <button
                type="button"
                onClick={() => setVisible(true)}
                className="w-full py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Solana Wallet to Post Comments</span>
              </button>
            ) : !username ? (
              <button
                type="button"
                onClick={openUsernameModal}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Claim Handle to Join Discussion</span>
              </button>
            ) : (
              <form onSubmit={handlePostComment} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-bold">
                    POSTING AS: <span className="text-amber-400 font-black">@{username}</span>
                  </span>

                  {/* Sentiment Switcher */}
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200 dark:border-white/5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSentiment("BULLISH")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        sentiment === "BULLISH"
                          ? "bg-emerald-500 text-zinc-950 font-black shadow-sm"
                          : "text-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      🚀 BULLISH
                    </button>
                    <button
                      type="button"
                      onClick={() => setSentiment("BEARISH")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        sentiment === "BEARISH"
                          ? "bg-rose-500 text-white font-black shadow-sm"
                          : "text-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      📉 BEARISH
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder={`Comment on $${callout.tokenSymbol} as @${username}...`}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-amber-500 font-mono placeholder:text-zinc-500 transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={isPosting || !newCommentText.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Handle Registration Modal ─────────────────────────────────── */}
      <SetUsernameModal
        isOpen={isUsernameModalOpen}
        onClose={closeUsernameModal}
        walletAddress={walletAddress}
        onClaimUsername={claimUsername}
      />
    </>
  );
}

export default CalloutDiscussionModal;
