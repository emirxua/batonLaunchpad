import { NextResponse } from "next/server";
import { linkWalletToUser, getUserById, getUserByEmail, getUserByWallet } from "@/lib/turso-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, wallet } = body;

    const identifier = userId || email;
    const cleanWallet = String(wallet || "").trim();

    if (!identifier || !cleanWallet) {
      return NextResponse.json(
        { success: false, error: "Both user identifier (userId/email) and wallet address are required" },
        { status: 400 }
      );
    }

    const result = await linkWalletToUser(identifier, cleanWallet);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: `Wallet ${cleanWallet.slice(0, 4)}…${cleanWallet.slice(-4)} linked to account!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
