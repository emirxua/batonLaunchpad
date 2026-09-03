import { NextResponse } from "next/server";
import { getUserTokenWatchlist, toggleUserTokenWatchlist } from "@/lib/turso-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("identifier")?.trim();

  if (!identifier) {
    return NextResponse.json({ success: true, watchlist: [] });
  }

  try {
    const list = await getUserTokenWatchlist(identifier);
    return NextResponse.json({ success: true, watchlist: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, mint, action } = body;

    if (!identifier || !mint) {
      return NextResponse.json(
        { success: false, error: "identifier and mint are required" },
        { status: 400 }
      );
    }

    const result = await toggleUserTokenWatchlist(identifier, mint, action);
    return NextResponse.json({
      success: true,
      isWatchlisted: result.isWatchlisted,
      watchlist: result.watchlist,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
