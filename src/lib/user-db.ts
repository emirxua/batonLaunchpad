import fs from "fs";
import path from "path";

interface UserRecord {
  wallet: string;
  username: string;
  registeredAt: number;
}

interface UserDatabase {
  users: Record<string, UserRecord>; // key: walletAddress
  usernames: Record<string, string>; // key: lowercase username -> walletAddress
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "users.json");

// Ensure data directory exists
function ensureDb(): UserDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: UserDatabase = { users: {}, usernames: {} };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw) as UserDatabase;
  } catch (err) {
    console.error("[user-db] Read error:", err);
    return { users: {}, usernames: {} };
  }
}

function saveDb(db: UserDatabase) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("[user-db] Save error:", err);
  }
}

export function getUserByWallet(wallet: string): UserRecord | null {
  const db = ensureDb();
  return db.users[wallet] || null;
}

export function isUsernameAvailable(username: string, requestingWallet?: string): boolean {
  const clean = username.trim().toLowerCase();
  const db = ensureDb();
  const existingWallet = db.usernames[clean];

  if (!existingWallet) return true;
  if (requestingWallet && existingWallet === requestingWallet) return true;
  return false;
}

export function registerUsername(
  wallet: string,
  username: string
): { success: boolean; error?: string; username?: string } {
  const clean = username.trim().toLowerCase();

  // Strict regex: lowercase letters and numbers only, 3 to 15 chars
  const validRegex = /^[a-z0-9]{3,15}$/;
  if (!validRegex.test(clean)) {
    return {
      success: false,
      error: "Username must be 3-15 characters, lowercase english letters and numbers only. No dots, dashes, or symbols.",
    };
  }

  const db = ensureDb();
  const existingOwnerWallet = db.usernames[clean];

  if (existingOwnerWallet && existingOwnerWallet !== wallet) {
    return {
      success: false,
      error: `Username "@${clean}" is already taken by another wallet. Please choose a different handle.`,
    };
  }

  // Remove old username if wallet had one previously
  const oldUser = db.users[wallet];
  if (oldUser && oldUser.username !== clean) {
    delete db.usernames[oldUser.username];
  }

  // Store new record
  const record: UserRecord = {
    wallet,
    username: clean,
    registeredAt: Date.now(),
  };

  db.users[wallet] = record;
  db.usernames[clean] = wallet;
  saveDb(db);

  return { success: true, username: clean };
}
