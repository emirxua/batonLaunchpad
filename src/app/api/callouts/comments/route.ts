import { NextResponse } from "next/server";
import { CommentItem } from "@/types/token";

export const dynamic = "force-dynamic";

// In-memory comments storage grouped by calloutId
const CALLOUT_COMMENTS_STORE: Record<string, CommentItem[]> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calloutId = searchParams.get("calloutId")?.trim();

  if (!calloutId) {
    return NextResponse.json(
      { success: false, error: "calloutId parameter required" },
      { status: 400 }
    );
  }

  const comments = CALLOUT_COMMENTS_STORE[calloutId] || [];
  return NextResponse.json({
    success: true,
    calloutId,
    count: comments.length,
    comments,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      calloutId,
      walletAddress,
      username,
      commentText,
      sentiment = "BULLISH",
    } = body;

    if (!calloutId || !walletAddress || !commentText?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required comment fields (walletAddress, commentText, calloutId)",
        },
        { status: 400 }
      );
    }

    const cleanText = String(commentText).trim();
    const cleanUsername = username ? String(username).trim().toLowerCase() : `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;

    const newComment: CommentItem = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      calloutId,
      authorName: `@${cleanUsername}`,
      authorHandle: cleanUsername,
      authorAvatar: cleanUsername.slice(0, 2).toUpperCase(),
      authorBadge: "Verified Holder",
      sentiment: sentiment === "BEARISH" ? "BEARISH" : "BULLISH",
      commentText: cleanText,
      timeAgo: "Just now",
      upvotes: 1,
    };

    if (!CALLOUT_COMMENTS_STORE[calloutId]) {
      CALLOUT_COMMENTS_STORE[calloutId] = [];
    }

    CALLOUT_COMMENTS_STORE[calloutId].unshift(newComment);

    return NextResponse.json({
      success: true,
      comment: newComment,
      totalComments: CALLOUT_COMMENTS_STORE[calloutId].length,
    });
  } catch (error) {
    console.error("API /api/callouts/comments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to post comment" },
      { status: 500 }
    );
  }
}
