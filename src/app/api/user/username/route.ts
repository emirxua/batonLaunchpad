import { NextResponse } from "next/server";
import {
  getUserByWallet,
  isUsernameAvailable,
  registerUsername,
} from "@/lib/turso-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet")?.trim();
  const checkUsername = searchParams.get("check")?.trim()?.toLowerCase();

  // 1. Availability check endpoint
  if (checkUsername) {
    const available = await isUsernameAvailable(checkUsername, wallet || undefined);
    return NextResponse.json({
      success: true,
      username: checkUsername,
      available,
    });
  }

  // 2. Fetch username for wallet
  if (!wallet) {
    return NextResponse.json(
      { success: false, error: "Wallet address parameter required" },
      { status: 400 }
    );
  }

  const user = await getUserByWallet(wallet);
  return NextResponse.json({
    success: true,
    wallet,
    username: user?.username || null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, username } = body;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid connected Solana wallet required" },
        { status: 400 }
      );
    }

    const cleanUsername = String(username || "")
      .trim()
      .toLowerCase();

    const result = await registerUsername(wallet, cleanUsername);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      wallet,
      username: result.username,
      message: `Handle @${result.username} successfully claimed!`,
    });
  } catch (error) {
    console.error("API /api/user/username error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error while registering username" },
      { status: 500 }
    );
  }
}
