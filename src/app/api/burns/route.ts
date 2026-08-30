import { NextResponse } from "next/server";
import { getAllBurns, recordBurn } from "@/lib/turso-db";
export type { RecordedBurn } from "@/lib/turso-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

export async function GET() {
  const burns = await getAllBurns();
  const totalBurned = burns.reduce((sum, b) => sum + b.amount, 0);

  return NextResponse.json({
    success: true,
    totalRecordedBurns: burns.length,
    totalBurnedAmount: totalBurned,
    solscanMintUrl: `https://solscan.io/token/${BATON_MINT}#txs`,
    incineratorUrl: "https://solscan.io/account/11111111111111111111111111111111",
    recentBurns: burns,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { txHash, coinId, coinName, coinTicker, amount, userAddress } = body;

    if (!txHash || !coinId || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required burn parameters (txHash, coinId, amount)" },
        { status: 400 }
      );
    }

    const burnAmount = Number(amount) || 0;
    const cleanTx = String(txHash).trim();

    const newRecord = await recordBurn({
      txHash: cleanTx,
      coinId: String(coinId),
      coinName: coinName || "Baton Corporation Ltd",
      coinTicker: coinTicker || "BATON",
      amount: burnAmount,
      userAddress: userAddress ? String(userAddress).trim() : "Anonymous",
    });

    const burns = await getAllBurns();
    const newTotal = burns
      .filter((b) => b.coinId === coinId || b.coinTicker?.toLowerCase() === String(coinTicker || "").toLowerCase())
      .reduce((sum, b) => sum + b.amount, 0);

    return NextResponse.json({
      success: true,
      record: newRecord,
      newTotalBurned: newTotal,
      message: `Successfully recorded on-chain burn of ${burnAmount.toLocaleString()} $BATON!`,
    });
  } catch (error) {
    console.error("API /api/burns error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record burn transaction" },
      { status: 500 }
    );
  }
}
