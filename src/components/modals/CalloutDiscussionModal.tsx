"use client";

import React, { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { CalloutItem, CommentItem } from "@/types/token";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SetUsernameModal } from "@/components/modals/SetUsernameModal";
import { AuthModal } from "@/components/modals/AuthModal";
import { TokenLogo } from "@/components/callouts/TokenLogo";
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
  const {
    user,
    username,
    email,
    isLoggedIn,
    needsUsername,
    isUsernameModalOpen,
    isGoogleLoginModalOpen,
    openGoogleLoginModal,
    closeGoogleLoginModal,
    openUsernameModal,
    closeUsernameModal,
    loginWithGoogle,
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

    if (!isLoggedIn) {
      openGoogleLoginModal();
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
          walletAddress: email || user?.id || "google_user",
          username: username,
          authorBadge: "Verified Alpha",
          sentiment,
          commentText: newCommentText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to post comment");
      }

      setNewCommentText("");
      if (refreshComments) {
        await refreshComments();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || "Error posting comment.");
    } finally {
      setIsPosting(false);
    }
  };

  const percentGain = Math.round((callout.multiplier - 1) * 100);

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none cursor-pointer"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#0A0C10] border border-amber-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden cursor-default"
        >
          {/* ── Modal Header: Token Alpha Snapshot ───────────────────────── */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/50 flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <TokenLogo
                src={callout.tokenIconUrl}
                symbol={callout.tokenSymbol}
                size="md"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-base sm:text-lg text-zinc-950 dark:text-white tracking-wide">
                    ${callout.tokenSymbol} Discussion
                  </h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{percentGain}% ({callout.multiplier}x)
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 block truncate">
                  Caller: <span className="font-bold text-amber-500">{callout.callerName}</span> · Entry MC: {formatCurrency(callout.entryMcap)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Caller Thesis Banner ──────────────────────────────────────── */}
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-xs text-zinc-700 dark:text-zinc-300 italic shrink-0 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold not-italic text-amber-500">Thesis: </span>
              &ldquo;{callout.thesis}&rdquo;
            </p>
          </div>

          {/* ── Comments Stream ───────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {commentsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 space-y-1">
                <MessageSquare className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-50" />
                <p className="font-bold">No thoughts posted on ${callout.tokenSymbol} yet.</p>
                <p className="text-[11px]">Be the first degen to share your bullish or bearish sentiment!</p>
              </div>
            ) : (
              commentsList.map((c) => {
                const isLiked = likedComments[c.id] || false;
                const totalLikes = Math.max(0, c.upvotes + (commentLikesDelta[c.id] || 0));

                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">
                          {c.authorAvatar || c.authorHandle.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {c.authorName}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                            c.sentiment === "BULLISH"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {c.sentiment}
                        </span>
                      </div>

                      <span className="text-[10px] text-zinc-500">{c.timeAgo}</span>
                    </div>

                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed pl-8">
                      {c.commentText}
                    </p>

                    <div className="flex justify-end pl-8 pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleLikeComment(c.id, e)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
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
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 mx-4 mb-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── Bottom: Sentiment Selector & Comment Input Form ─────────────── */}
          <div className="p-4 border-t border-zinc-200 dark:border-white/10 shrink-0 space-y-2 bg-zinc-50 dark:bg-zinc-900/30">
            {!isLoggedIn ? (
              <button
                type="button"
                onClick={openGoogleLoginModal}
                className="w-full py-3 rounded-2xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Sign In to Join Discussion</span>
              </button>
            ) : needsUsername ? (
              <button
                type="button"
                onClick={openUsernameModal}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Claim Handle to Post Comments</span>
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
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-zinc-950 dark:text-white outline-none focus:border-amber-500 font-mono placeholder:text-zinc-500 transition-colors"
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

      {/* ── Unified Sign In Modal ──────────────────────────────────────── */}
      <AuthModal
        isOpen={isGoogleLoginModalOpen}
        onClose={closeGoogleLoginModal}
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
}

export default CalloutDiscussionModal;
