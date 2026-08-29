# Baton Launchpad ($BATON)

Outbid & Burn Launchpad with Real-Time Pump.fun Native Callouts Stream.

## 🚀 Pump.fun Native Callouts Integration

Pump.fun introduced **Native Callouts** allowing creators and callers to push coin alerts to their followers on a 6-hour cooldown window.

### Authentication Setup (`PUMPFUN_JWT`)

Upstream native callout endpoints (`https://frontend-api-v3.pump.fun/callout/*` and `https://advanced-api-v2.pump.fun/callout/*`) are protected by Cloudflare and require a signed user JWT token.

#### How to obtain your `PUMPFUN_JWT`:
1. Open [pump.fun](https://pump.fun) in your desktop browser and connect your wallet.
2. Open Chrome/Brave DevTools (`F12` or `Cmd + Option + I`).
3. Go to the **Application** tab → **Storage** → **Local Storage** (or **Cookies** for `pump.fun`).
4. Find the JWT session token (e.g., `token`, `jwt`, or `auth_token`).
5. Open your `.env.local` file and set:
   ```env
   PUMPFUN_JWT=eyJhbGciOi...
   ```
6. (Optional) If Cloudflare requires full cookies, also set:
   ```env
   PUMPFUN_COOKIE=__cf_bm=...; cf_clearance=...;
   ```
7. Restart your development server (`npm run dev`).

### Architecture & Data Layer

1. **Server Proxy (`/api/callouts`)**:
   - Strictly server-side: Client never queries pump.fun APIs directly (avoiding CORS and keeping JWT secret).
   - In parallel queries:
     - Tracked wallets (`CALLOUT_WATCH_WALLETS`, default: Alon `6DtEedWf9Wk5hA7Xth82Eq441yf5DA4aGLqaQAVfDokm`)
     - Global live callouts (`/callouts`)
     - Callers leaderboard (`/callout/leaderboard`)
   - **DexScreener Enrichment**:
     - Batches unique mints in chunks of max 30 to `https://api.dexscreener.com/latest/dex/tokens/{mints}` for live market cap, 24h % change, and volume.
   - **Zero False Mocks**:
     - No reply count / comment scraping masquerading as callouts.
     - If upstream is unauthenticated (401/403), the API returns a structured diagnostic with `PUMPFUN_JWT required`.

2. **Frontend UI (`components/callouts/LiveCallouts.tsx`)**:
   - `useSWR("/api/callouts", { refreshInterval: 12000, keepPreviousData: true })`
   - Watching stream banner for Alon and alpha callers.
   - Top callers leaderboard.
   - Boost with $BATON integration.
