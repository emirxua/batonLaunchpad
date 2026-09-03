import { createClient, Client } from "@libsql/client";
import fs from "fs";
import path from "path";
import { CommentItem } from "@/types/token";

export interface UserRecord {
  id: string;
  googleId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  wallet?: string;
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

  // 1. Users Table (Google Auth & Unique Username)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE,
      name TEXT,
      avatar_url TEXT,
      wallet TEXT,
      username TEXT UNIQUE NOT NULL,
      registered_at INTEGER NOT NULL
    );
  `);

  // Backward compatibility column additions for existing Turso tables
  const alterColumns = [
    "ALTER TABLE users ADD COLUMN id TEXT;",
    "ALTER TABLE users ADD COLUMN google_id TEXT;",
    "ALTER TABLE users ADD COLUMN email TEXT;",
    "ALTER TABLE users ADD COLUMN name TEXT;",
    "ALTER TABLE users ADD COLUMN avatar_url TEXT;",
    "ALTER TABLE users ADD COLUMN wallet TEXT;",
  ];
  for (const alterSql of alterColumns) {
    try {
      await client.execute(alterSql);
    } catch {
      // Column already exists
    }
  }

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));
  `);
  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
  `);

  // 2. Burns Table (On-Chain Burns with Username/Wallet Association)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS burns (
      id TEXT PRIMARY KEY,
      tx_hash TEXT UNIQUE NOT NULL,
      coin_id TEXT NOT NULL,
      coin_name TEXT,
      coin_ticker TEXT,
      amount REAL NOT NULL,
      user_address TEXT,
      username TEXT,
      user_email TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  try {
    await client.execute("ALTER TABLE burns ADD COLUMN username TEXT;");
    await client.execute("ALTER TABLE burns ADD COLUMN user_email TEXT;");
  } catch {}
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_burns_coin ON burns(coin_id);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_burns_created ON burns(created_at DESC);
  `);

  // 3. Comments Table (Callout Discussion Stream)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      callout_id TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      username TEXT NOT NULL,
      author_badge TEXT,
      sentiment TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      likes INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_comments_callout ON comments(callout_id);
  `);

  // 4. Callout Likes / Upvotes Persistence Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS callout_likes (
      callout_id TEXT NOT NULL,
      user_identifier TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY(callout_id, user_identifier)
    );
  `);

  // 5. Watchlist / Tracked Alpha Wallets Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS watchlist (
      wallet TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // 6. User Starred Token Watchlist Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_token_watchlists (
      identifier TEXT NOT NULL,
      mint TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY(identifier, mint)
    );
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_user_token_watchlists_id ON user_token_watchlists(identifier);
  `);
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

// ── USERS CRUD (Google Auth + Unique Turso DB Usernames) ─────────────────────

export async function getUserById(id: string): Promise<UserRecord | null> {
  await ensureInit();
  const client = getClient();
  const res = await client.execute({
    sql: "SELECT id, google_id as googleId, email, name, avatar_url as avatarUrl, wallet, username, registered_at as registeredAt FROM users WHERE id = ? LIMIT 1",
    args: [id.trim()],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id || ""),
    googleId: row.googleId ? String(row.googleId) : undefined,
    email: row.email ? String(row.email) : undefined,
    name: row.name ? String(row.name) : undefined,
    avatarUrl: row.avatarUrl ? String(row.avatarUrl) : undefined,
    wallet: row.wallet ? String(row.wallet) : undefined,
    username: String(row.username || ""),
    registeredAt: Number(row.registeredAt || Date.now()),
  };
}

export async function getUserByGoogleId(googleId: string): Promise<UserRecord | null> {
  await ensureInit();
  const client = getClient();
  const res = await client.execute({
    sql: "SELECT id, google_id as googleId, email, name, avatar_url as avatarUrl, wallet, username, registered_at as registeredAt FROM users WHERE google_id = ? LIMIT 1",
    args: [googleId.trim()],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id || ""),
    googleId: row.googleId ? String(row.googleId) : undefined,
    email: row.email ? String(row.email) : undefined,
    name: row.name ? String(row.name) : undefined,
    avatarUrl: row.avatarUrl ? String(row.avatarUrl) : undefined,
    wallet: row.wallet ? String(row.wallet) : undefined,
    username: String(row.username || ""),
    registeredAt: Number(row.registeredAt || Date.now()),
  };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  await ensureInit();
  const client = getClient();
  const clean = email.trim().toLowerCase();
  const res = await client.execute({
    sql: "SELECT id, google_id as googleId, email, name, avatar_url as avatarUrl, wallet, username, registered_at as registeredAt FROM users WHERE LOWER(email) = ? LIMIT 1",
    args: [clean],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id || ""),
    googleId: row.googleId ? String(row.googleId) : undefined,
    email: row.email ? String(row.email) : undefined,
    name: row.name ? String(row.name) : undefined,
    avatarUrl: row.avatarUrl ? String(row.avatarUrl) : undefined,
    wallet: row.wallet ? String(row.wallet) : undefined,
    username: String(row.username || ""),
    registeredAt: Number(row.registeredAt || Date.now()),
  };
}

export async function getUserByWallet(wallet: string): Promise<UserRecord | null> {
  await ensureInit();
  const client = getClient();
  const res = await client.execute({
    sql: "SELECT id, google_id as googleId, email, name, avatar_url as avatarUrl, wallet, username, registered_at as registeredAt FROM users WHERE wallet = ? LIMIT 1",
    args: [wallet.trim()],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id || ""),
    googleId: row.googleId ? String(row.googleId) : undefined,
    email: row.email ? String(row.email) : undefined,
    name: row.name ? String(row.name) : undefined,
    avatarUrl: row.avatarUrl ? String(row.avatarUrl) : undefined,
    wallet: row.wallet ? String(row.wallet) : undefined,
    username: String(row.username || ""),
    registeredAt: Number(row.registeredAt || Date.now()),
  };
}

export async function getUserByUsername(username: string): Promise<UserRecord | null> {
  await ensureInit();
  const client = getClient();
  const clean = username.trim().toLowerCase();
  const res = await client.execute({
    sql: "SELECT id, google_id as googleId, email, name, avatar_url as avatarUrl, wallet, username, registered_at as registeredAt FROM users WHERE LOWER(username) = ? LIMIT 1",
    args: [clean],
  });

  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id || ""),
    googleId: row.googleId ? String(row.googleId) : undefined,
    email: row.email ? String(row.email) : undefined,
    name: row.name ? String(row.name) : undefined,
    avatarUrl: row.avatarUrl ? String(row.avatarUrl) : undefined,
    wallet: row.wallet ? String(row.wallet) : undefined,
    username: String(row.username || ""),
    registeredAt: Number(row.registeredAt || Date.now()),
  };
}

export async function isUsernameAvailable(
  username: string,
  requestingUserId?: string
): Promise<boolean> {
  await ensureInit();
  const client = getClient();
  const clean = username.trim().toLowerCase();

  const res = await client.execute({
    sql: "SELECT id, google_id as googleId, email, wallet FROM users WHERE LOWER(username) = ? LIMIT 1",
    args: [clean],
  });

  if (res.rows.length === 0) return true;
  const row = res.rows[0];
  const matchedId = String(row.id || "");
  const matchedEmail = String(row.email || "").toLowerCase();
  const matchedGoogleId = String(row.googleId || "");
  const matchedWallet = String(row.wallet || "");

  if (
    requestingUserId &&
    (matchedId === requestingUserId ||
      matchedEmail === requestingUserId.toLowerCase() ||
      matchedGoogleId === requestingUserId ||
      matchedWallet === requestingUserId)
  ) {
    return true;
  }
  return false;
}

export async function linkWalletToUser(
  userIdOrEmail: string,
  walletAddress: string
): Promise<{ success: boolean; user?: UserRecord; error?: string }> {
  await ensureInit();
  const client = getClient();
  const cleanWallet = walletAddress.trim();
  const cleanId = userIdOrEmail.trim();

  if (!cleanWallet || !cleanId) {
    return { success: false, error: "Missing user identifier or wallet address" };
  }

  try {
    // 1. Update user record with wallet
    await client.execute({
      sql: `UPDATE users SET wallet = ? WHERE id = ? OR LOWER(email) = ? OR google_id = ?`,
      args: [cleanWallet, cleanId, cleanId.toLowerCase(), cleanId],
    });

    const updatedUser =
      (await getUserById(cleanId)) ||
      (await getUserByEmail(cleanId)) ||
      (await getUserByWallet(cleanWallet));

    return {
      success: true,
      user: updatedUser || undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Turso DB] linkWallet error:", err);
    return { success: false, error: msg || "Failed to link wallet." };
  }
}

export async function registerOrUpdateGoogleUser(params: {
  googleId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  username?: string;
}): Promise<{ user: UserRecord; isNew: boolean; needsUsername: boolean }> {
  await ensureInit();
  const client = getClient();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanGoogleId = params.googleId.trim();
  const id = `usr_${cleanGoogleId || Buffer.from(cleanEmail).toString("hex").slice(0, 12)}`;
  const now = Date.now();

  let existing = await getUserByGoogleId(cleanGoogleId);
  if (!existing && cleanEmail) {
    existing = await getUserByEmail(cleanEmail);
  }

  if (existing) {
    await client.execute({
      sql: `UPDATE users SET 
              name = COALESCE(?, name),
              avatar_url = COALESCE(?, avatar_url),
              google_id = COALESCE(?, google_id)
            WHERE id = ? OR LOWER(email) = ?`,
      args: [params.name || null, params.avatarUrl || null, cleanGoogleId, existing.id, cleanEmail],
    });
    const updated = (await getUserById(existing.id)) || (await getUserByEmail(cleanEmail)) || existing;
    return {
      user: updated,
      isNew: false,
      needsUsername: !updated.username || updated.username.length < 3,
    };
  }

  const initialUsername = params.username ? params.username.trim().toLowerCase() : "";
  await client.execute({
    sql: `INSERT INTO users (id, google_id, email, name, avatar_url, username, registered_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, cleanGoogleId, cleanEmail, params.name || "", params.avatarUrl || "", initialUsername, now],
  });

  const newUser: UserRecord = {
    id,
    googleId: cleanGoogleId,
    email: cleanEmail,
    name: params.name,
    avatarUrl: params.avatarUrl,
    username: initialUsername,
    registeredAt: now,
  };

  return {
    user: newUser,
    isNew: true,
    needsUsername: !initialUsername || initialUsername.length < 3,
  };
}

export async function claimOrUpdateUsername(
  userIdOrEmail: string,
  username: string
): Promise<{ success: boolean; error?: string; user?: UserRecord }> {
  await ensureInit();
  const client = getClient();
  const clean = username.trim().toLowerCase();
  const cleanId = userIdOrEmail.trim();

  // Strict validation: lowercase letters and numbers only, 3 to 15 chars
  const validRegex = /^[a-z0-9]{3,15}$/;
  if (!validRegex.test(clean)) {
    return {
      success: false,
      error: "Username must be 3-15 characters, lowercase english letters and numbers only. No spaces, symbols, dots or dashes.",
    };
  }

  // Check if username taken by another user
  const existingUser = await getUserByUsername(clean);
  if (
    existingUser &&
    existingUser.id !== cleanId &&
    existingUser.email?.toLowerCase() !== cleanId.toLowerCase() &&
    existingUser.googleId !== cleanId
  ) {
    return {
      success: false,
      error: `Username "@${clean}" is already claimed by another user. Please choose a different handle.`,
    };
  }

  const now = Date.now();

  try {
    // If user already exists in DB, update their username
    const res = await client.execute({
      sql: `UPDATE users SET username = ? WHERE id = ? OR LOWER(email) = ? OR google_id = ?`,
      args: [clean, cleanId, cleanId.toLowerCase(), cleanId],
    });

    if (res.rowsAffected === 0) {
      // Create record if not existed yet
      const id = `usr_${Buffer.from(cleanId).toString("hex").slice(0, 12)}`;
      const isEmail = cleanId.includes("@");
      await client.execute({
        sql: `INSERT INTO users (id, google_id, email, username, registered_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [id, isEmail ? null : cleanId, isEmail ? cleanId.toLowerCase() : null, clean, now],
      });
    }

    let user = (await getUserById(cleanId)) || (await getUserByEmail(cleanId)) || (await getUserByUsername(clean));

    return {
      success: true,
      user: user || undefined,
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

// ── COMMENTS CRUD ──────────────────────────────────────────────────────────

function timeAgoFromTimestamp(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function addComment(data: {
  calloutId: string;
  walletAddress: string;
  username: string;
  authorBadge?: string;
  sentiment: "BULLISH" | "BEARISH";
  commentText: string;
}): Promise<CommentItem> {
  await ensureInit();
  const client = getClient();
  const id = `comm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cleanText = data.commentText.trim();
  const cleanUsername = data.username.trim().toLowerCase();
  const now = Date.now();
  const badge = data.authorBadge || "Verified Holder";

  await client.execute({
    sql: `
      INSERT INTO comments (id, callout_id, wallet_address, username, author_badge, sentiment, comment_text, likes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    args: [
      id,
      data.calloutId.trim(),
      data.walletAddress.trim(),
      cleanUsername,
      badge,
      data.sentiment,
      cleanText,
      1,
      now,
    ],
  });

  return {
    id,
    calloutId: data.calloutId,
    authorName: `@${cleanUsername}`,
    authorHandle: cleanUsername,
    authorAvatar: cleanUsername.slice(0, 2).toUpperCase(),
    authorBadge: badge,
    sentiment: data.sentiment,
    commentText: cleanText,
    timeAgo: "Just now",
    upvotes: 1,
  };
}

export async function getCommentsByCallout(calloutId: string): Promise<CommentItem[]> {
  await ensureInit();
  const client = getClient();
  const res = await client.execute({
    sql: `
      SELECT id, callout_id as calloutId, wallet_address as walletAddress, username, author_badge as authorBadge, sentiment, comment_text as commentText, likes, created_at as createdAt
      FROM comments
      WHERE callout_id = ?
      ORDER BY created_at DESC
      LIMIT 100;
    `,
    args: [calloutId.trim()],
  });

  return res.rows.map((row) => {
    const handle = String(row.username || "anon");
    const timestamp = Number(row.createdAt);
    const sent = String(row.sentiment).toUpperCase() === "BEARISH" ? "BEARISH" : "BULLISH";

    return {
      id: String(row.id),
      calloutId: String(row.calloutId),
      authorName: `@${handle}`,
      authorHandle: handle,
      authorAvatar: handle.slice(0, 2).toUpperCase(),
      authorBadge: String(row.authorBadge || "Verified Holder"),
      sentiment: sent,
      commentText: String(row.commentText),
      timeAgo: timeAgoFromTimestamp(timestamp),
      upvotes: Number(row.likes || 1),
    };
  });
}

export async function toggleCommentLike(commentId: string, delta: number): Promise<{ success: boolean; likes: number }> {
  await ensureInit();
  const client = getClient();
  await client.execute({
    sql: `
      UPDATE comments
      SET likes = MAX(1, likes + ?)
      WHERE id = ?;
    `,
    args: [delta, commentId.trim()],
  });

  const res = await client.execute({
    sql: "SELECT likes FROM comments WHERE id = ? LIMIT 1",
    args: [commentId.trim()],
  });

  const likes = res.rows.length > 0 ? Number(res.rows[0].likes) : 1;
  return { success: true, likes };
}

export async function resolveUserIdentifiers(identifier: string): Promise<string[]> {
  await ensureInit();
  const client = getClient();
  const cleanId = identifier.trim().toLowerCase();
  const ids = new Set<string>([cleanId]);

  try {
    const userRes = await client.execute({
      sql: `SELECT id, google_id, email, wallet, username FROM users 
            WHERE LOWER(wallet) = ? 
               OR LOWER(email) = ? 
               OR LOWER(id) = ? 
               OR LOWER(username) = ? 
               OR LOWER(google_id) = ? LIMIT 1`,
      args: [cleanId, cleanId, cleanId, cleanId, cleanId],
    });

    if (userRes.rows.length > 0) {
      const u = userRes.rows[0];
      if (u.wallet) ids.add(String(u.wallet).trim().toLowerCase());
      if (u.email) ids.add(String(u.email).trim().toLowerCase());
      if (u.id) ids.add(String(u.id).trim().toLowerCase());
      if (u.username) ids.add(String(u.username).trim().toLowerCase());
      if (u.google_id) ids.add(String(u.google_id).trim().toLowerCase());
    }
  } catch (err) {
    console.error("[Turso DB] Error resolving user identifiers:", err);
  }

  return Array.from(ids);
}

export async function getUserTokenWatchlist(identifier: string): Promise<string[]> {
  await ensureInit();
  const client = getClient();
  const linkedIds = await resolveUserIdentifiers(identifier);

  if (linkedIds.length === 0) return [];

  const placeholders = linkedIds.map(() => "?").join(",");
  const res = await client.execute({
    sql: `SELECT DISTINCT mint FROM user_token_watchlists WHERE LOWER(identifier) IN (${placeholders}) ORDER BY created_at DESC`,
    args: linkedIds,
  });
  return res.rows.map((r) => String(r.mint));
}

export async function setUserTokenWatchlist(
  identifier: string,
  mint: string,
  action: "add" | "remove"
): Promise<{ isWatchlisted: boolean; watchlist: string[] }> {
  await ensureInit();
  const client = getClient();
  const cleanMint = mint.trim();
  const linkedIds = await resolveUserIdentifiers(identifier);

  if (action === "add") {
    // Save under the primary identifier, and also any known wallet/email
    const primaryId = identifier.trim().toLowerCase();
    await client.execute({
      sql: "INSERT OR IGNORE INTO user_token_watchlists (identifier, mint, created_at) VALUES (?, ?, ?)",
      args: [primaryId, cleanMint, Date.now()],
    });

    // Also mirror to other linked identifiers if present
    for (const otherId of linkedIds) {
      if (otherId !== primaryId) {
        try {
          await client.execute({
            sql: "INSERT OR IGNORE INTO user_token_watchlists (identifier, mint, created_at) VALUES (?, ?, ?)",
            args: [otherId, cleanMint, Date.now()],
          });
        } catch {}
      }
    }
  } else {
    // Remove across ALL linked identifiers so it stays removed everywhere
    const placeholders = linkedIds.map(() => "?").join(",");
    await client.execute({
      sql: `DELETE FROM user_token_watchlists WHERE LOWER(identifier) IN (${placeholders}) AND mint = ?`,
      args: [...linkedIds, cleanMint],
    });
  }

  const all = await getUserTokenWatchlist(identifier);
  return { isWatchlisted: action === "add", watchlist: all };
}

export async function toggleUserTokenWatchlist(
  identifier: string,
  mint: string,
  explicitAction?: "add" | "remove"
): Promise<{ isWatchlisted: boolean; watchlist: string[] }> {
  await ensureInit();
  const cleanMint = mint.trim();

  let action = explicitAction;
  if (!action) {
    const existing = await getUserTokenWatchlist(identifier);
    const hasIt = existing.some((m) => m.toLowerCase() === cleanMint.toLowerCase());
    action = hasIt ? "remove" : "add";
  }

  return setUserTokenWatchlist(identifier, cleanMint, action);
}


