import { NextResponse } from "next/server";
import { addComment, getCommentsByCallout, toggleCommentLike } from "@/lib/turso-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const calloutId = searchParams.get("calloutId")?.trim();

  if (!calloutId) {
    return NextResponse.json(
      { success: false, error: "calloutId parameter required" },
      { status: 400 }
    );
  }

  const comments = await getCommentsByCallout(calloutId);
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
      action,
      commentId,
      delta,
    } = body;

    // Optional like toggle action
    if (action === "like" && commentId) {
      const result = await toggleCommentLike(commentId, Number(delta) || 1);
      return NextResponse.json({
        success: true,
        commentId,
        likes: result.likes,
      });
    }

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
    const cleanUsername = username
      ? String(username).trim().toLowerCase()
      : `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;

    const newComment = await addComment({
      calloutId: String(calloutId),
      walletAddress: String(walletAddress),
      username: cleanUsername,
      authorBadge: "Verified Holder",
      sentiment: sentiment === "BEARISH" ? "BEARISH" : "BULLISH",
      commentText: cleanText,
    });

    const allComments = await getCommentsByCallout(String(calloutId));

    return NextResponse.json({
      success: true,
      comment: newComment,
      totalComments: allComments.length,
      comments: allComments,
    });
  } catch (error) {
    console.error("API /api/callouts/comments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to post comment to Turso database" },
      { status: 500 }
    );
  }
}
