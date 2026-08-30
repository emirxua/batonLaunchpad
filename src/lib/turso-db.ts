import { createClient, Client } from "@libsql/client";
import fs from "fs";
import path from "path";

export interface UserRecord {
  wallet: string;
  username: string;
  registeredAt: number;
}

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

let clientInstance: Client | null = null;
let initializedPromise: Promise<void> | null = null;

export function getClient(): Client {
  if (clientInstance) return clientInstance;

  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (url && (url.startsWith("libsql://") || url.startsWith("https://"))) {
    clientInstance = createClient({
      url,
      authToken,
    });
  } else {
    // Local SQLite database fallback on disk
    const dataDir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, "outbid.db");
    clientInstance = createClient({
      url: `file:${dbPath}`,
    });
  }

  return clientInstance;
}

async function initDb(): Promise<void> {
  const client = getClient();

  // 1. Users Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      wallet TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      registered_at INTEGER NOT NULL
    );
  `);
  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));
  `);

  // 2. Burns Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS burns (
      id TEXT PRIMARY KEY,
      tx_hash TEXT UNIQUE NOT NULL,
      coin_id TEXT NOT NULL,
      coin_name TEXT,
      coin_ticker TEXT,
      amount REAL NOT NULL,
      user_address TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_burns_coin ON burns(coin_id);
  `);

  // 3. Migrate legacy .data/users.json if present
  try {
    const dataDir = path.join(process.cwd(), ".data");
    const jsonPath = path.join(dataDir, "users.json");
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf8");
      const legacy = JSON.parse(raw);
      if (legacy?.users) {
        for (const u of Object.values(legacy.users) as any[]) {
          if (u.wallet && u.username) {
            await client.execute({
              sql: `INSERT INTO users (wallet, username, registered_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(wallet) DO UPDATE SET username=excluded.username;`,
              args: [u.wallet.trim(), u.username.trim().toLowerCase(), u.registeredAt || Date.now()],
            }).catch(() => {});
          }
        }
      }
    }
  } catch (migErr) {
    console.warn("[Turso DB] Legacy users migration notice:", migErr);
  }
}

export function ensureInit(): Promise<void> {
  if (!initializedPromise) {
    initializedPromise = initDb().catch((err) => {
      console.error("[Turso DB] Initialization error:", err);
      initializedPromise = null;
    });
  }
  return initializedPromise;
}

// ── USERS CRUD ─────────────────────────────────────────────────────────────

export async function getUserByWallet(wallet: string): Promise<UserRecord | null> {
  await ensureInit();
  const client = getClient();
  const res = await client.execute({
    sql: "SELECT wallet, username, registered_at as registeredAt FROM users WHERE wallet = ? LIMIT 1",
    args: [wallet.trim()],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    wallet: String(row.wallet),
    username: String(row.username),
    registeredAt: Number(row.registeredAt),
  };
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  await ensureInit();
  const client = getClient();
  const clean = username.trim().toLowerCase();
  const res = await client.execute({
    sql: "SELECT wallet, username, registered_at as registeredAt FROM users WHERE LOWER(username) = ? LIMIT 1",
    args: [clean],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    wallet: String(row.wallet),
    username: String(row.username),
    registeredAt: Number(row.registeredAt),
  };
}

export async function isUsernameAvailable(
  username: string,
  requestingWallet?: string
): Promise<boolean> {
  await ensureInit();
  const client = getClient();
  const clean = username.trim().toLowerCase();

  const res = await client.execute({
    sql: "SELECT wallet FROM users WHERE LOWER(username) = ? LIMIT 1",
    args: [clean],
  });

  if (res.rows.length === 0) return true;
  const existingWallet = String(res.rows[0].wallet);
  if (requestingWallet && existingWallet === requestingWallet.trim()) return true;
  return false;
}

export async function registerUsername(
  wallet: string,
  username: string
): Promise<{ success: boolean; error?: string; username?: string }> {
  await ensureInit();
  const client = getClient();
  const clean = username.trim().toLowerCase();
  const cleanWallet = wallet.trim();

  // Strict regex: lowercase letters and numbers only, 3 to 15 chars
  const validRegex = /^[a-z0-9]{3,15}$/;
  if (!validRegex.test(clean)) {
    return {
      success: false,
      error: "Username must be 3-15 characters, lowercase english letters and numbers only. No dots, dashes, or symbols.",
    };
  }

  // Check if username is taken by another wallet
  const existingUser = await getUserByUsername(clean);
  if (existingUser && existingUser.wallet !== cleanWallet) {
    return {
      success: false,
      error: `Username "@${clean}" is already taken by another wallet. Please choose a different handle.`,
    };
  }

  const now = Date.now();

  try {
    await client.execute({
      sql: `
        INSERT INTO users (wallet, username, registered_at)
        VALUES (?, ?, ?)
        ON CONFLICT(wallet) DO UPDATE SET
          username = excluded.username,
          registered_at = excluded.registered_at;
      `,
      args: [cleanWallet, clean, now],
    });

    return {
      success: true,
      username: clean,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE constraint failed") || msg.includes("idx_users_username")) {
      return {
        success: false,
        error: `Username "@${clean}" was just claimed. Please choose a different handle.`,
      };
    }
    console.error("[Turso DB] Register error:", err);
    return {
      success: false,
      error: "Failed to save username. Please try again.",
    };
  }
}

// ── BURNS CRUD ─────────────────────────────────────────────────────────────

export async function recordBurn(burn: {
  txHash: string;
  coinId: string;
  coinName?: string;
  coinTicker?: string;
  amount: number;
  userAddress?: string;
}): Promise<RecordedBurn> {
  await ensureInit();
  const client = getClient();
  const cleanTx = burn.txHash.trim();
  const id = `burn-${Date.now()}-${cleanTx.slice(0, 8)}`;
  const now = Date.now();
  const coinName = burn.coinName || "Baton Corporation Ltd";
  const coinTicker = burn.coinTicker || "BATON";
  const userAddress = burn.userAddress?.trim() || "Anonymous";

  await client.execute({
    sql: `
      INSERT INTO burns (id, tx_hash, coin_id, coin_name, coin_ticker, amount, user_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tx_hash) DO UPDATE SET amount = excluded.amount;
    `,
    args: [id, cleanTx, burn.coinId, coinName, coinTicker, burn.amount, userAddress, now],
  });

  return {
    id,
    txHash: cleanTx,
    coinId: burn.coinId,
    coinName,
    coinTicker,
    amount: burn.amount,
    userAddress,
    timestamp: now,
    solscanUrl: `https://solscan.io/tx/${cleanTx}`,
  };
}

export async function getAllBurns(): Promise<RecordedBurn[]> {
  await ensureInit();
  const client = getClient();
  const res = await client.execute(
    "SELECT id, tx_hash as txHash, coin_id as coinId, coin_name as coinName, coin_ticker as coinTicker, amount, user_address as userAddress, created_at as timestamp FROM burns ORDER BY created_at DESC LIMIT 100"
  );

  return res.rows.map((row) => ({
    id: String(row.id),
    txHash: String(row.txHash),
    coinId: String(row.coinId),
    coinName: String(row.coinName || "Baton Corporation Ltd"),
    coinTicker: String(row.coinTicker || "BATON"),
    amount: Number(row.amount),
    userAddress: String(row.userAddress || "Anonymous"),
    timestamp: Number(row.timestamp),
    solscanUrl: `https://solscan.io/tx/${row.txHash}`,
  }));
}

export async function getBurnTotalsByCoin(): Promise<Record<string, number>> {
  await ensureInit();
  const client = getClient();
  const res = await client.execute(
    "SELECT coin_id as coinId, SUM(amount) as total FROM burns GROUP BY coin_id"
  );

  const totals: Record<string, number> = {};
  for (const row of res.rows) {
    totals[String(row.coinId)] = Number(row.total);
  }
  return totals;
}
