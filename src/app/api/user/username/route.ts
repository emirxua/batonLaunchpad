import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory store for registered wallet usernames
const WALLET_TO_USERNAME: Record<string, string> = {};
const TAKEN_USERNAMES = new Set<string>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet")?.trim();
  const checkUsername = searchParams.get("check")?.trim()?.toLowerCase();

  if (checkUsername) {
    const isAvailable = !TAKEN_USERNAMES.has(checkUsername);
    return NextResponse.json({
      success: true,
      username: checkUsername,
      available: isAvailable,
    });
  }

  if (!wallet) {
    return NextResponse.json(
      { success: false, error: "Wallet parameter required" },
      { status: 400 }
    );
  }

  const username = WALLET_TO_USERNAME[wallet] || null;
  return NextResponse.json({
    success: true,
    wallet,
    username,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet, username } = body;

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json(
        { success: false, error: "Valid connected wallet address required" },
        { status: 400 }
      );
    }

    const cleanUsername = String(username || "")
      .trim()
      .toLowerCase();

    // Strict validation: Only lowercase letters and numbers (3 to 15 characters). No dots, dashes, or symbols.
    const validRegex = /^[a-z0-9]{3,15}$/;
    if (!validRegex.test(cleanUsername)) {
      return NextResponse.json(
        {
          success: false,
          error: "Username must be 3-15 characters long, lowercase letters and numbers only. No dots, dashes, or symbols allowed.",
        },
        { status: 400 }
      );
    }

    // Check if username is already taken by ANOTHER wallet
    const existingOwner = Object.entries(WALLET_TO_USERNAME).find(
      ([, name]) => name === cleanUsername
    );

    if (existingOwner && existingOwner[0] !== wallet) {
      return NextResponse.json(
        {
          success: false,
          error: `Username "@${cleanUsername}" is already taken. Please choose another handle.`,
        },
        { status: 409 }
      );
    }

    // If this wallet had an old username, release it
    const oldUsername = WALLET_TO_USERNAME[wallet];
    if (oldUsername && oldUsername !== cleanUsername) {
      TAKEN_USERNAMES.delete(oldUsername);
    }

    WALLET_TO_USERNAME[wallet] = cleanUsername;
    TAKEN_USERNAMES.add(cleanUsername);

    return NextResponse.json({
      success: true,
      wallet,
      username: cleanUsername,
      message: `Handle @${cleanUsername} successfully claimed!`,
    });
  } catch (error) {
    console.error("API /api/user/username error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set username" },
      { status: 500 }
    );
  }
}
