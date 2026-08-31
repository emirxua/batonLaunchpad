import { NextResponse } from "next/server";
import {
  getUserById,
  getUserByEmail,
  getUserByWallet,
  getUserByUsername,
  isUsernameAvailable,
  claimOrUpdateUsername,
} from "@/lib/turso-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId")?.trim();
  const email = searchParams.get("email")?.trim();
  const wallet = searchParams.get("wallet")?.trim();
  const checkUsername = searchParams.get("check")?.trim()?.toLowerCase();

  // 1. Availability check endpoint
  if (checkUsername) {
    const requester = userId || email || wallet || undefined;
    const available = await isUsernameAvailable(checkUsername, requester);
    return NextResponse.json({
      success: true,
      username: checkUsername,
      available,
    });
  }

  // 2. Fetch user by userId, email, or wallet
  let user = null;
  if (userId) {
    user = await getUserById(userId);
  } else if (email) {
    user = await getUserByEmail(email);
  } else if (wallet) {
    user = await getUserByWallet(wallet);
  } else {
    return NextResponse.json(
      { success: false, error: "userId, email, or wallet parameter required" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    user: user || null,
    username: user?.username || null,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, wallet, username } = body;

    const identifier = userId || email || wallet;
    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid userId or email required" },
        { status: 400 }
      );
    }

    const cleanUsername = String(username || "")
      .trim()
      .toLowerCase();

    const result = await claimOrUpdateUsername(identifier, cleanUsername);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      username: result.user?.username || cleanUsername,
      message: `Handle @${cleanUsername} successfully claimed!`,
    });
  } catch (error) {
    console.error("API /api/user/username error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error while registering username" },
      { status: 500 }
    );
  }
}
