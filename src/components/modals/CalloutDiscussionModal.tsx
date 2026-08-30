"use client";

import React, { useState } from "react";
import { CalloutItem, CommentItem } from "@/types/token";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
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
} from "lucide-react";

interface CalloutDiscussionModalProps {
  callout: CalloutItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CalloutDiscussionModal({
  callout,
  isOpen,
  onClose,
}: CalloutDiscussionModalProps) {
  const { connected, publicKey } = useWallet();

  // Local state array for comments - 100% user generated with zero mock fallback
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [sentiment, setSentiment] = useState<"BULLISH" | "BEARISH">("BULLISH");
  const [upvoteMap, setUpvoteMap] = useState<Record<string, number>>({});

  if (!isOpen || !callout) return null;

  const handleUpvoteComment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvoteMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const shortHandle = publicKey
      ? `${publicKey.toBase58().slice(0, 4)}…${publicKey.toBase58().slice(-4)}`
      : "degen_anon";

    const newComm: CommentItem = {
      id: `comm-${Date.now()}`,
      calloutId: callout.id,
      authorName: connected ? "Solana Degen" : "Alpha Scout",
      authorHandle: shortHandle,
      authorAvatar: "DG",
      authorBadge: "Verified Holder",
      sentiment: sentiment,
      commentText: newCommentText.trim(),
      timeAgo: "Just now",
      upvotes: 1,
    };

    setCommentsList((prev) => [newComm, ...prev]);
    setNewCommentText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-mono select-none">
      <div className="bg-white dark:bg-[#0D0E12] border border-amber-500/30 rounded-3xl w-full max-w-xl p-5 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Modal Header: Callout Summary ─────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-zinc-200 dark:border-white/10 pb-4 shrink-0">
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
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 space-y-1.5 shrink-0 text-xs">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase">
            <span>Original Alpha Thesis</span>
            <span>Entry MC: {formatCurrency(callout.entryMcap)}</span>
          </div>
          <p className="text-zinc-800 dark:text-zinc-200 italic font-mono leading-relaxed">
            &ldquo;{callout.thesis}&rdquo;
          </p>
        </div>

        {/* ── Community Comments Thread List (Scrollable) ───────────────── */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-72 min-h-[140px]">
          <div className="flex items-center justify-between text-xs text-zinc-500 px-1 font-bold">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Community Sentiment &amp; Comments ({commentsList.length})</span>
            </span>
          </div>

          {commentsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              No comments posted yet. Be the first to share your alpha thesis!
            </div>
          ) : (
            commentsList.map((c) => {
              const count = c.upvotes + (upvoteMap[c.id] || 0);
              const isBull = c.sentiment === "BULLISH";

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 space-y-2 text-xs"
                >
                {/* Author Info & Sentiment Tag */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {c.authorAvatar}
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
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isBull
                          ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                      }`}
                    >
                      {c.sentiment}
                    </span>
                    <span className="text-[10px] text-zinc-500">{c.timeAgo}</span>
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-zinc-700 dark:text-zinc-300 font-mono leading-relaxed pl-8">
                  {c.commentText}
                </p>

                {/* Bottom Upvote */}
                <div className="flex justify-end pl-8">
                  <button
                    type="button"
                    onClick={(e) => handleUpvoteComment(c.id, e)}
                    className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-amber-400 transition-colors p-1"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{count}</span>
                  </button>
                </div>
              </div>
            );
          }))}
        </div>

        {/* ── Post a Comment Form ────────────────────────────────────────── */}
        <form onSubmit={handlePostComment} className="pt-3 border-t border-zinc-200 dark:border-white/10 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold text-zinc-500 uppercase">
              Your Sentiment:
            </span>
            <div className="inline-flex p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setSentiment("BULLISH")}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  sentiment === "BULLISH"
                    ? "bg-emerald-500 text-zinc-950 font-extrabold shadow-sm"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                🚀 Bullish
              </button>
              <button
                type="button"
                onClick={() => setSentiment("BEARISH")}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  sentiment === "BEARISH"
                    ? "bg-rose-500 text-white font-extrabold shadow-sm"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                📉 Bearish
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Join discussion on this callout..."
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none placeholder:text-zinc-500 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0 uppercase tracking-wider"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalloutDiscussionModal;
