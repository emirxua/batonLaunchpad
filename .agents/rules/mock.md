---
trigger: always_on
---

# STRICT ANTI-MOCK & REAL API DIRECTIVES (ALWAYS ENFORCED)

### 1. ABSOLUTE BAN ON MOCK / FAKE / HARDCODED DATA
- Under NO circumstance are you allowed to create, import, rename, or fallback to mock data, dummy constants, or sample objects.
- FORBIDDEN naming patterns: `MOCK_*`, `SAMPLE_*`, `INITIAL_*`, `DEFAULT_*`, `FALLBACK_*`, `DUMMY_*`.
- State initialization for arrays/objects (tokens, callouts, markets, leaderboard) MUST strictly be empty array `[]` or `null`.
- In `catch` blocks or error states, DO NOT return hardcoded data. Keep state empty (`[]`) and show clean empty/loading state.

### 2. REAL ON-CHAIN & API INTEGRATIONS ONLY
- All token feeds, trending data, prices, and metrics MUST fetch directly from real endpoints (DexScreener API, CoinGecko, Solana RPC / PumpPortal).
- Swap & Burn actions must execute real on-chain transaction flows via connected Solana wallets.