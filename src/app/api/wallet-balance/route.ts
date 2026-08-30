import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RPC_ENDPOINTS = [
  "https://api.mainnet-beta.solana.com",
  "https://rpc.ankr.com/solana",
  "https://solana.drpc.org",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletStr = searchParams.get("wallet")?.trim();
    const mintStr = searchParams.get("mint")?.trim();

    if (!walletStr) {
      return NextResponse.json({ error: "Missing wallet parameter" }, { status: 400 });
    }

    let walletKey: PublicKey;
    try {
      walletKey = new PublicKey(walletStr);
    } catch {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    let solBalance: number = 0;
    let tokenBalance: number = 0;

    let success = false;
    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        const connection = new Connection(rpcUrl, {
          commitment: "confirmed",
          confirmTransactionInitialTimeout: 10000,
        });

        // 1. SOL Balance
        const lamports = await connection.getBalance(walletKey, "confirmed");
        solBalance = lamports / LAMPORTS_PER_SOL;

        // 2. Direct SPL Token Balance via Associated Token Account (ATA)
        if (mintStr && mintStr !== "So11111111111111111111111111111111111111112") {
          const mintKey = new PublicKey(mintStr);
          let found = false;

          // Standard SPL Token ATA
          try {
            const ata = getAssociatedTokenAddressSync(mintKey, walletKey, true, TOKEN_PROGRAM_ID);
            const bal = await connection.getTokenAccountBalance(ata, "confirmed");
            if (bal?.value?.uiAmount !== undefined && bal?.value?.uiAmount !== null) {
              tokenBalance = bal.value.uiAmount;
              found = true;
            }
          } catch {
            // ATA does not exist yet (0 balance) or not Tokenkeg
          }

          // Token-2022 ATA Fallback
          if (!found) {
            try {
              const ata2022 = getAssociatedTokenAddressSync(mintKey, walletKey, true, TOKEN_2022_PROGRAM_ID);
              const bal2022 = await connection.getTokenAccountBalance(ata2022, "confirmed");
              if (bal2022?.value?.uiAmount !== undefined && bal2022?.value?.uiAmount !== null) {
                tokenBalance = bal2022.value.uiAmount;
                found = true;
              }
            } catch {
              // 0 balance
            }
          }
        }

        success = true;
        break;
      } catch (rpcErr) {
        console.warn(`[WalletBalance API] Attempt failed on ${rpcUrl}:`, rpcErr);
      }
    }

    if (!success) {
      return NextResponse.json({ error: "Failed to query Solana RPC" }, { status: 502 });
    }

    return NextResponse.json(
      {
        wallet: walletStr,
        mint: mintStr || null,
        solBalance,
        tokenBalance,
        timestamp: Date.now(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
