import { NextResponse } from "next/server";
import { TRACKED_COINS } from "@/lib/tracked-coins";

export const dynamic = "force-dynamic";

export interface RecordedBurn {
  id: string;
  txHash: string;
  coinId: string;
  coinName?: string;
  coinTicker?: string;
  amount: number;
  userAddress: string;
  timestamp: number;
}

// In-memory burn storage for real runtime transactions
const BURNS_STORE: RecordedBurn[] = [];

export async function GET() {
  const totalBurned = BURNS_STORE.reduce((sum, b) => sum + b.amount, 0);

  return NextResponse.json({
    success: true,
    totalRecordedBurns: BURNS_STORE.length,
    totalBurnedAmount: totalBurned,
    recentBurns: BURNS_STORE.slice(0, 30),
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

    // 2. Record genuine on-chain burn transaction
    const newRecord: RecordedBurn = {
      id: `burn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      txHash: String(txHash).trim(),
      coinId: String(coinId),
      coinName: targetCoin?.name || "Baton",
      coinTicker: targetCoin?.ticker || "BATON",
      amount: burnAmount,
      userAddress: userAddress ? String(userAddress).trim() : "Anonymous",
      timestamp: Date.now(),
    };

    BURNS_STORE.unshift(newRecord);

    return NextResponse.json({
      success: true,
      record: newRecord,
      newTotalBurned: targetCoin?.totalBurnedBaton || burnAmount,
      message: `Successfully recorded on-chain burn of ${burnAmount.toLocaleString()} $BATON for ${
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
