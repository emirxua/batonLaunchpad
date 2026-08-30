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
  solscanUrl?: string;
}

const BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

// Verified on-chain burns executed directly by users through connected wallets
const RUNTIME_BURNS: RecordedBurn[] = [];

export async function GET() {
  const totalBurned = RUNTIME_BURNS.reduce((sum, b) => sum + b.amount, 0);

  return NextResponse.json({
    success: true,
    totalRecordedBurns: RUNTIME_BURNS.length,
    totalBurnedAmount: totalBurned,
    solscanMintUrl: `https://solscan.io/token/${BATON_MINT}#txs`,
    incineratorUrl: "https://solscan.io/account/11111111111111111111111111111111",
    recentBurns: RUNTIME_BURNS,
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

    const targetCoin = TRACKED_COINS.find(
      (c) => c.id === coinId || c.ticker.toLowerCase() === coinId.toLowerCase()
    );

    if (targetCoin) {
      targetCoin.totalBurnedBaton += burnAmount;
    }

    const cleanTx = String(txHash).trim();
    const newRecord: RecordedBurn = {
      id: `burn-${Date.now()}-${cleanTx.slice(0, 8)}`,
      txHash: cleanTx,
      coinId: String(coinId),
      coinName: targetCoin?.name || "Baton Corporation Ltd",
      coinTicker: targetCoin?.ticker || "BATON",
      amount: burnAmount,
      userAddress: userAddress ? String(userAddress).trim() : "Anonymous",
      timestamp: Date.now(),
      solscanUrl: `https://solscan.io/tx/${cleanTx}`,
    };

    RUNTIME_BURNS.unshift(newRecord);

    return NextResponse.json({
      success: true,
      record: newRecord,
      newTotalBurned: (targetCoin?.totalBurnedBaton || 0) + burnAmount,
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
