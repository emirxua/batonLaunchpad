import {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createBurnInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Real pump.fun Solana Base58 mint address for $BATON
export const OFFICIAL_BATON_MINT = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";

export function safePublicKey(
  key?: string | PublicKey | null,
  fallback: string = OFFICIAL_BATON_MINT
): PublicKey {
  if (key instanceof PublicKey) return key;
  if (!key) return new PublicKey(fallback);
  try {
    return new PublicKey(key);
  } catch {
    return new PublicKey(fallback);
  }
}

export interface CreateBurnTransactionParams {
  userPublicKey: PublicKey;
  amount: number; // In UI units (e.g. 50,000 $BATON)
  mintAddress?: string;
  targetCoinId: string;
  decimals?: number;
}

/**
 * Creates an on-chain SPL Token Burn Transaction.
 * 1. Computes the user's Associated Token Account (ATA)
 * 2. Adds the SPL Token Burn Instruction
 * 3. Appends an on-chain Memo instruction: `BATON_SUPPORT:{targetCoinId}` for provable boost ranking
 */
export function createBurnTransaction({
  userPublicKey,
  amount,
  mintAddress,
  targetCoinId,
  decimals = 6,
}: CreateBurnTransactionParams): {
  transaction: Transaction;
  userAta: PublicKey;
  rawAmount: bigint;
  memo: string;
} {
  const mintPublicKey = safePublicKey(mintAddress || process.env.NEXT_PUBLIC_BATON_MINT_ADDRESS);

  // 1. Derive user's ATA for $BATON
  const userAta = getAssociatedTokenAddressSync(
    mintPublicKey,
    userPublicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  // 2. Compute raw amount with decimals
  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));

  const transaction = new Transaction();

  // 3. Create SPL Token Burn Instruction
  const burnInstruction = createBurnInstruction(
    userAta,
    mintPublicKey,
    userPublicKey,
    rawAmount,
    [],
    TOKEN_PROGRAM_ID
  );
  transaction.add(burnInstruction);

  // 4. Create on-chain Memo Instruction
  const memoText = `BATON_SUPPORT:${targetCoinId}`;
  const memoInstruction = new TransactionInstruction({
    keys: [{ pubkey: userPublicKey, isSigner: true, isWritable: true }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoText, "utf-8"),
  });
  transaction.add(memoInstruction);

  return {
    transaction,
    userAta,
    rawAmount,
    memo: memoText,
  };
}
