import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  Connection,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createBurnInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const BATON_MINT_ADDRESS = "2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump";
export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export function createMemoInstruction(
  memo: string,
  signers: PublicKey[]
): TransactionInstruction {
  return new TransactionInstruction({
    keys: signers.map((pubkey) => ({
      pubkey,
      isSigner: true,
      isWritable: true,
    })),
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, "utf-8"),
  });
}

export interface PrepareBurnParams {
  connection: Connection;
  userPublicKey: PublicKey;
  burnAmount: number;
  targetCoinTicker?: string;
  targetMint?: string;
}

/**
 * Fetches the latest Solana blockhash via fast server proxy with multi-RPC fallback
 */
export async function getResilientBlockhash(connection: Connection): Promise<{
  blockhash: string;
  lastValidBlockHeight: number;
}> {
  try {
    const res = await fetch("/api/solana/blockhash", {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.success && data.blockhash) {
      return {
        blockhash: data.blockhash,
        lastValidBlockHeight: data.lastValidBlockHeight,
      };
    }
  } catch (proxyErr) {
    console.warn("Blockhash proxy notice, falling back to direct RPC:", proxyErr);
  }

  // Fallback to direct client connection
  return await connection.getLatestBlockhash("confirmed");
}

/**
 * Builds a real Solana SPL Token Burn Transaction.
 * 1. Derives Associated Token Account (ATA) for $BATON (2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump)
 * 2. Multiplies by 10^6 decimals into a BigInt
 * 3. Creates SPL Token createBurnInstruction
 * 4. Adds transparent Memo instruction BOOST:<targetMint> or BATON_BURN:<amount>:<ticker>
 * 5. Attaches reliable recentBlockhash without CORS / 403 errors
 */
export async function prepareRealBurnTransaction({
  connection,
  userPublicKey,
  burnAmount,
  targetCoinTicker = "BATON",
  targetMint,
}: PrepareBurnParams): Promise<{
  transaction: Transaction;
  userAta: PublicKey;
  burnAmountBigInt: bigint;
  blockhash: string;
  lastValidBlockHeight: number;
}> {
  const mintPubkey = new PublicKey(BATON_MINT_ADDRESS);

  // 1. Derive user's Associated Token Account deterministically
  const userAta = getAssociatedTokenAddressSync(
    mintPubkey,
    userPublicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  // 2. Convert burnAmount (e.g. 10000) to BigInt with 6 decimals
  const burnAmountBigInt = BigInt(Math.floor(burnAmount * 1_000_000));
  if (burnAmountBigInt <= BigInt(0)) {
    throw new Error("Burn amount must be greater than zero.");
  }

  // 3. Create SPL Burn Instruction
  const burnIx = createBurnInstruction(
    userAta,
    mintPubkey,
    userPublicKey,
    burnAmountBigInt,
    [],
    TOKEN_PROGRAM_ID
  );

  // 4. Create on-chain transparency Memo Instruction: BOOST:<targetMint>
  const memoText = targetMint
    ? `BOOST:${targetMint}`
    : `BATON_BURN:${burnAmount}:${targetCoinTicker}`;
  const memoIx = createMemoInstruction(memoText, [userPublicKey]);

  // 5. Assemble Transaction
  const transaction = new Transaction().add(burnIx, memoIx);

  // 6. Fetch resilient blockhash from proxy
  const { blockhash, lastValidBlockHeight } = await getResilientBlockhash(connection);
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = userPublicKey;

  return {
    transaction,
    userAta,
    burnAmountBigInt,
    blockhash,
    lastValidBlockHeight,
  };
}
