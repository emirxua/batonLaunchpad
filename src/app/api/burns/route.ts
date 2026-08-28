import { NextResponse } from "next/server";
import { TRACKED_COINS } from "@/lib/tracked-coins";

export const dynamic = "force-dynamic";

export interface RecordedBurn {
  id: string;
  txHash: string;
  coinId: string;
  amount: number;
  userAddress: string;
  timestamp: number;
}

// In-memory burn storage for demo / runtime state
const BURNS_STORE: RecordedBurn[] = [
  {
    id: "burn-init-1",
    txHash: "4yU9qKxJ...solscan",
    coinId: "1",
    amount: 150000,
    userAddress: "8xK...9mP",
    timestamp: Date.now() - 3600000,
  },
  {
    id: "burn-init-2",
    txHash: "2bW8xLmN...solscan",
    coinId: "2",
    amount: 50000,
    userAddress: "3fR...7vX",
    timestamp: Date.now() - 7200000,
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    totalRecordedBurns: BURNS_STORE.length,
    recentBurns: BURNS_STORE.slice(0, 20),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { txHash, coinId, amount, userAddress } = body;

    if (!txHash || !coinId || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required burn parameters (txHash, coinId, amount)" },
        { status: 400 }
      );
    }

    const burnAmount = Number(amount) || 0;

    // 1. Update in-memory tracked coins
    const targetCoin = TRACKED_COINS.find(
      (c) => c.id === coinId || c.ticker.toLowerCase() === coinId.toLowerCase()
    );

    if (targetCoin) {
      targetCoin.totalBurnedBaton += burnAmount;
    }

    // 2. Record burn transaction
    const newRecord: RecordedBurn = {
      id: `burn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      txHash,
      coinId,
      amount: burnAmount,
      userAddress: userAddress || "Anonymous",
      timestamp: Date.now(),
    };

    BURNS_STORE.unshift(newRecord);

    return NextResponse.json({
      success: true,
      record: newRecord,
      newTotalBurned: targetCoin?.totalBurnedBaton || burnAmount,
      message: `Successfully burned ${burnAmount.toLocaleString()} $BATON for ${
        targetCoin?.name || coinId
      }!`,
    });
  } catch (error) {
    console.error("API /api/burns error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record burn transaction" },
      { status: 500 }
    );
  }
}
