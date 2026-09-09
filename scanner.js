/**
 * FlowerOS Scanner — scanner.js  (v2 — full data edition)
 *
 * API Strategy:
 *   PRIMARY (2-step DexScreener):
 *     1. GET /token-boosts/top/v1  → Solana token addresses
 *     2. GET /latest/dex/tokens/{addr1,addr2,...} → pairs with
 *        market cap, 24h volume, 24h change, logo, dexscreener URL
 *
 *   FALLBACK A (pump.fun direct):
 *     GET https://frontend-api.pump.fun/coins/latest?...
 *     → name, symbol, image_uri, usd_market_cap, mint
 *
 *   FALLBACK B (Netlify proxy for pump.fun — for when direct CORS fails):
 *     GET /.netlify/functions/scanner-proxy?source=pumpfun
 *
 *   All fallbacks tried in order; error state shown only if all fail.
 *   Never shows hardcoded/static data.
 */

'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const REFRESH_INTERVAL_MS = 5_000;    // auto-refresh every 5s
const MANUAL_COOLDOWN_MS  = 10_000;
const FETCH_TIMEOUT_MS    = 9_000;
const LOG                 = '[FlowerOS Scanner]';

/* $BATON — always pinned first */
const BATON_CA        = '2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump';
const BATON_PAIR_SLUG = '5wg14qetnz2xo1rbccdud7pyqkbko2luj8nmrtpwimmx';
const BATON_DEX_URL   = `https://dexscreener.com/solana/${BATON_PAIR_SLUG}`;
const BATON_LOGO      = 'assets/baton-main.jpg';

const MIS_CA = BATON_CA;
const MIS_PAIR_SLUG = BATON_PAIR_SLUG;
const MIS_DEX_URL = BATON_DEX_URL;
const MIS_LOGO = BATON_LOGO;

// Is site running on Netlify (has functions available)?
const IS_NETLIFY = window.location.hostname !== 'localhost' &&
                   window.location.hostname !== '127.0.0.1' &&
                   !window.location.protocol.startsWith('file');

/* ============================================================
   STATE
   ============================================================ */
const state = {
  coins:         [],
  lastFetchTime: null,
  lastManualAt:  null,
  intervalId:    null,
  counterId:     null,
  destroyed:     false,
};

/* ============================================================
   DOM
   ============================================================ */
const el = {
  skeletons:    () => document.getElementById('scSkeletonGrid'),
  loadingText:  () => document.getElementById('scLoadingText'),
  coinsGrid:    () => document.getElementById('scCoinsGrid'),
  error:        () => document.getElementById('scError'),
  errorMsg:     () => document.getElementById('scErrorMsg'),
  retryBtn:     () => document.getElementById('scRetryBtn'),
  updatedLabel: () => document.getElementById('scUpdatedLabel'),
  refreshBtn:   () => document.getElementById('scRefreshBtn'),
};

/* ============================================================
   FORMATTING
   ============================================================ */
function fmtUSD(n) {
  if (n == null || isNaN(n) || n === 0) return '—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtChange(pct) {
  if (pct == null || isNaN(pct)) return { text: '—%', cls: 'neutral' };
  return {
    text: (pct >= 0 ? '+' : '') + Number(pct).toFixed(2) + '%',
    cls:  pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral',
  };
}

function timeAgo(date) {
  if (!date) return 'never';
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

/* ============================================================
   XSS SAFE HELPERS
   ============================================================ */
function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function escAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ============================================================
   FETCH HELPER
   ============================================================ */
async function fetchJSON(url, ms = FETCH_TIMEOUT_MS) {
  const ctl = new AbortController();
  const tid = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal:  ctl.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
}

/* ============================================================
   PARSERS
   ============================================================ */

/**
 * @typedef {Object} Token
 * @property {string}      name        — token name (e.g. "Pepe")
 * @property {string}      symbol      — ticker (e.g. "PEPE")
 * @property {string|null} description — short description from boost/profile
 * @property {string|null} logoUrl
 * @property {number|null} marketCap
 * @property {number|null} volume24h
 * @property {number|null} change24h
 * @property {string}      dexUrl
 */

/**
 * Parse DexScreener /latest/dex/tokens/{addresses} response.
 * Response shape: { pairs: [...] }  OR  just an array.
 * Each pair: baseToken.name, baseToken.symbol, info.imageUrl, marketCap,
 *            volume.h24, priceChange.h24, url
 * We keep the highest-volume pair per token address.
 */
function parseDexPairs(raw, boostMetaMap = {}) {
  const pairs = Array.isArray(raw)
    ? raw
    : (Array.isArray(raw?.pairs) ? raw.pairs : []);

  if (pairs.length === 0) return [];

  // Group by base token address → keep highest-volume pair per token
  const byToken = new Map();
  for (const pair of pairs) {
    const addr = pair?.baseToken?.address;
    if (!addr) continue;
    const vol = Number(pair?.volume?.h24 ?? 0);
    if (!byToken.has(addr) || vol > (byToken.get(addr)._vol ?? 0)) {
      byToken.set(addr, { ...pair, _vol: vol });
    }
  }

  return [...byToken.values()].map(pair => {
    const addr = pair.baseToken?.address || '';
    const meta = boostMetaMap[addr] || {};

    // Name: baseToken.name from pair data is the real coin name (e.g. "Pepe")
    // Fallback to boost header if pair name is missing
    const name = pair.baseToken?.name || meta.header || 'Unknown';

    // Symbol: baseToken.symbol from pair
    const symbol = pair.baseToken?.symbol || meta.symbol || '';

    // Logo: pair info.imageUrl first, then boost icon
    const logoUrl = pair.info?.imageUrl || meta.icon || null;

    // Description: only from boost metadata (not used as name!)
    const description = meta.description || null;

    const mc = pair.marketCap ?? pair.fdv ?? null;

    return {
      name,
      symbol,
      description,
      logoUrl,
      marketCap: mc ? Number(mc) : null,
      volume24h: pair.volume?.h24 ? Number(pair.volume.h24) : null,
      change24h: pair.priceChange?.h24 != null ? Number(pair.priceChange.h24) : null,
      dexUrl:    pair.url || `https://dexscreener.com/solana/${addr}`,
    };
  });
}

/**
 * Parse pump.fun /coins/latest response.
 * Fields: name, symbol, image_uri, usd_market_cap, description, mint
 */
function parsePumpFun(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return list.slice(0, 24).map(t => ({
    name:        t.name        || 'Unknown',
    symbol:      t.symbol      || '',
    description: t.description || null,
    logoUrl:     t.image_uri   || null,
    marketCap:   t.usd_market_cap ? Number(t.usd_market_cap) : null,
    volume24h:   null,
    change24h:   null,
    dexUrl:      t.mint
      ? `https://dexscreener.com/solana/${t.mint}`
      : 'https://pump.fun',
  }));
}

/* ============================================================
   DATA STRATEGY — tried in order
   ============================================================ */

/**
 * Chunk an array into groups of `size`.
 */
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

/**
 * STRATEGY 1 (best data):
 *   Step A: DexScreener /token-boosts/top/v1 → Solana token addresses + metadata
 *   Step B: DexScreener /latest/dex/tokens/{addrs} in batches → full pair data
 *           (name = baseToken.name, symbol = baseToken.symbol, logo = info.imageUrl)
 *
 * The boostMetaMap is passed to parseDexPairs so it can use:
 *   - boost.header      → displayed as fallback coin name
 *   - boost.description → shown as small subtitle below name
 *   - boost.icon        → logo fallback
 */
async function strategyDexTwoStep() {
  console.log(`${LOG} [Strategy 1] DexScreener 2-step...`);

  // Step A — get boosted tokens with full metadata
  const boostsRaw = await fetchJSON('https://api.dexscreener.com/token-boosts/top/v1');
  const boosts = (Array.isArray(boostsRaw) ? boostsRaw : [])
    .filter(b => b.chainId === 'solana' && b.tokenAddress)
    .slice(0, 24);

  if (boosts.length === 0) throw new Error('No Solana tokens from boosts');

  // Build a metadata map: tokenAddress → { icon, header, description }
  // NOTE: boost.header = token name  |  boost.description = marketing text
  const boostMetaMap = {};
  for (const b of boosts) {
    boostMetaMap[b.tokenAddress] = {
      icon:        b.icon        || null,
      header:      b.header      || null,   // ← real token name
      description: b.description || null,   // ← marketing blurb (subtitle)
    };
  }

  // Step B — fetch full pair data in batches of 10 (API limit safe)
  const addresses  = boosts.map(b => b.tokenAddress);
  const batches    = chunk(addresses, 10);
  const allPairs   = [];

  for (const batch of batches) {
    try {
      const raw = await fetchJSON(
        `https://api.dexscreener.com/latest/dex/tokens/${batch.join(',')}`
      );
      const pairs = Array.isArray(raw) ? raw : (raw?.pairs ?? []);
      allPairs.push(...pairs);
    } catch (err) {
      console.warn(`${LOG} Batch fetch failed:`, err.message);
      // continue with next batch
    }
  }

  if (allPairs.length === 0) throw new Error('No pairs returned from batches');

  const tokens = parseDexPairs({ pairs: allPairs }, boostMetaMap);
  if (tokens.length === 0) throw new Error('Parsed 0 tokens from pairs');

  console.log(`${LOG} [Strategy 1] OK — ${tokens.length} tokens`);
  return tokens;
}

/**
 * STRATEGY 2: pump.fun direct (CORS depends on deployment)
 */
async function strategyPumpFunDirect() {
  console.log(`${LOG} [Strategy 2] Pump.fun direct...`);
  const raw = await fetchJSON(
    'https://frontend-api.pump.fun/coins/latest?limit=24&sort=market_cap&order=DESC&includeNsfw=false'
  );
  const tokens = parsePumpFun(raw);
  if (tokens.length === 0) throw new Error('Pump.fun returned 0 coins');
  console.log(`${LOG} [Strategy 2] OK — ${tokens.length} tokens`);
  return tokens;
}

/**
 * STRATEGY 3: pump.fun via Netlify proxy (only on Netlify)
 */
async function strategyPumpFunProxy() {
  if (!IS_NETLIFY) throw new Error('Not on Netlify — skipping proxy');
  console.log(`${LOG} [Strategy 3] Pump.fun via Netlify proxy...`);
  const raw = await fetchJSON('/.netlify/functions/scanner-proxy?source=pumpfun');
  const tokens = parsePumpFun(raw);
  if (tokens.length === 0) throw new Error('Proxy pump.fun returned 0 coins');
  console.log(`${LOG} [Strategy 3] OK — ${tokens.length} tokens`);
  return tokens;
}

/**
 * STRATEGY 4: DexScreener token profiles → then pairs (secondary path)
 */
async function strategyDexProfiles() {
  console.log(`${LOG} [Strategy 4] DexScreener profiles...`);
  const profilesRaw = await fetchJSON('https://api.dexscreener.com/token-profiles/latest/v1');
  const profiles = (Array.isArray(profilesRaw) ? profilesRaw : [])
    .filter(p => p.chainId === 'solana' && p.tokenAddress)
    .slice(0, 24);

  if (profiles.length === 0) throw new Error('No Solana profiles');

  // Build metadata map — same structure as boostMetaMap
  // profile.header = token name, profile.description = description text
  const profileMetaMap = {};
  for (const p of profiles) {
    profileMetaMap[p.tokenAddress] = {
      icon:        p.icon        || null,
      header:      p.header      || null,
      description: p.description || null,
    };
  }

  // Fetch pairs in batches of 10
  const addresses = profiles.map(p => p.tokenAddress);
  const allPairs  = [];
  for (const batch of chunk(addresses, 10)) {
    try {
      const raw = await fetchJSON(
        `https://api.dexscreener.com/latest/dex/tokens/${batch.join(',')}`
      );
      const pairs = Array.isArray(raw) ? raw : (raw?.pairs ?? []);
      allPairs.push(...pairs);
    } catch (err) {
      console.warn(`${LOG} Profile batch failed:`, err.message);
    }
  }

  if (allPairs.length === 0) throw new Error('No pairs from profiles');

  const tokens = parseDexPairs({ pairs: allPairs }, profileMetaMap);
  if (tokens.length === 0) throw new Error('Parsed 0 from profiles');

  console.log(`${LOG} [Strategy 4] OK — ${tokens.length} tokens`);
  return tokens;
}


/* ============================================================
   $MISANTHROPIC — always pinned at position 0
   ============================================================ */
async function fetchMisCoin() {
  try {
    const raw  = await fetchJSON(
      `https://api.dexscreener.com/latest/dex/pairs/solana/${MIS_PAIR_SLUG}`
    );
    const pair = raw?.pair ?? (Array.isArray(raw?.pairs) ? raw.pairs[0] : null);
    if (!pair) throw new Error('No pair data');

    const mc = pair.marketCap ?? pair.fdv ?? null;
    return {
      name:        'Misanthropic',
      symbol:      'MISANTHROPIC',
      description: 'The crying flower. Born from an Elon tweet. Zero tax. Solana.',
      logoUrl:     MIS_LOGO,
      marketCap:   mc ? Number(mc) : null,
      volume24h:   pair.volume?.h24 ? Number(pair.volume.h24) : null,
      change24h:   pair.priceChange?.h24 != null ? Number(pair.priceChange.h24) : null,
      dexUrl:      MIS_DEX_URL,
      _pinned:     true,
    };
  } catch (err) {
    console.warn(`${LOG} MISANTHROPIC fetch failed, using static fallback:`, err.message);
    return {
      name:        'Misanthropic',
      symbol:      'MISANTHROPIC',
      description: 'The crying flower. Born from an Elon tweet. Zero tax. Solana.',
      logoUrl:     MIS_LOGO,
      marketCap:   null,
      volume24h:   null,
      change24h:   null,
      dexUrl:      MIS_DEX_URL,
      _pinned:     true,
    };
  }
}

/* ============================================================
   MAIN FETCH ORCHESTRATOR
   ============================================================ */
async function fetchTrendingData() {
  console.log(`${LOG} Fetching trending data... (${new Date().toLocaleTimeString()})`);

  // Always fetch MIS live data in parallel with trending
  const [misToken, trendingResult] = await Promise.allSettled([
    fetchMisCoin(),
    (async () => {
      const strategies = [
        strategyDexTwoStep,
        strategyPumpFunDirect,
        strategyPumpFunProxy,
        strategyDexProfiles,
      ];
      let lastErr = null;
      for (const strategy of strategies) {
        try {
          const tokens = await strategy();
          return tokens.filter(t => t.name && t.name !== 'Unknown');
        } catch (err) {
          console.warn(`${LOG} Strategy failed:`, err.message);
          lastErr = err;
        }
      }
      throw lastErr || new Error('All strategies failed');
    })(),
  ]);

  // Trending list (may be empty if all strategies failed)
  let trending = trendingResult.status === 'fulfilled' ? trendingResult.value : [];

  // Remove $MISANTHROPIC if it appears in the trending list (avoid duplicate)
  trending = trending.filter(
    t => t.symbol?.toUpperCase() !== 'MISANTHROPIC' &&
         !t.dexUrl?.includes(MIS_PAIR_SLUG) &&
         !t.dexUrl?.includes(MIS_CA)
  );

  // Prepend MIS — always first
  const mis = misToken.status === 'fulfilled' ? misToken.value : null;
  if (mis) trending.unshift(mis);

  if (trending.length === 0) throw new Error('No tokens and no MIS data');

  return trending;
}

/* ============================================================
   CARD RENDERING
   ============================================================ */
function buildCoinCard(token) {
  const change  = fmtChange(token.change24h);
  const mcText  = fmtUSD(token.marketCap);
  const volText = fmtUSD(token.volume24h);

  // Symbol line: shown below name in terracotta colour
  const symbolHtml = token.symbol
    ? `<div class="sc-coin-symbol">$${esc(token.symbol)}</div>`
    : '';

  // Description: short marketing text shown as subtitle (max 60 chars)
  let descText = (token.description || '').trim();
  if (descText.length > 72) descText = descText.slice(0, 69) + '…';
  const descHtml = descText
    ? `<div class="sc-coin-desc">${esc(descText)}</div>`
    : '';

  const card = document.createElement('a');
  card.className = token._pinned ? 'sc-coin-card sc-pinned' : 'sc-coin-card';
  card.href      = token.dexUrl || '#';
  card.target    = '_blank';
  card.rel       = 'noopener noreferrer';
  card.setAttribute('role', 'listitem');
  card.setAttribute(
    'aria-label',
    `${token.name}${token.symbol ? ' ($' + token.symbol + ')' : ''} — open on DexScreener`
  );

  // Pinned badge (only for $MISANTHROPIC)
  const pinnedBadgeHtml = token._pinned
    ? `<div class="sc-pinned-badge">🌸 Our Coin</div>`
    : '';

  // Logo: img tag if URL available, emoji fallback
  const logoHtml = token.logoUrl
    ? `<div class="sc-coin-logo">
         <img
           src="${escAttr(token.logoUrl)}"
           alt="${escAttr(token.name)} logo"
           loading="lazy"
           onerror="this.style.display='none';this.parentElement.textContent='🌸'"
         >
       </div>`
    : `<div class="sc-coin-logo" aria-hidden="true">🌸</div>`;

  card.innerHTML = `
    ${pinnedBadgeHtml ? `<div class="sc-card-pinned-row">${pinnedBadgeHtml}</div>` : ''}
    <div class="sc-card-top">
      ${logoHtml}
      <div class="sc-coin-info">
        <div class="sc-coin-name">${esc(token.name)}</div>
        ${symbolHtml}
      </div>
      <span class="sc-change-badge ${change.cls}">${change.text}</span>
    </div>

    ${descHtml ? `<div class="sc-card-desc-row">${descHtml}</div>` : ''}

    <div class="sc-card-stats">
      <div class="sc-stat-block">
        <span class="sc-stat-label">Market Cap</span>
        <span class="sc-stat-value">${mcText}</span>
      </div>
      <div class="sc-stat-block">
        <span class="sc-stat-label">24h Volume</span>
        <span class="sc-stat-value">${volText}</span>
      </div>
    </div>

    <div class="sc-card-link-row">
      <span class="sc-dex-badge">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        View on DexScreener ↗
      </span>
    </div>
  `;

  return card;
}

function renderCoins(tokens) {
  const grid = el.coinsGrid();
  if (!grid) return;
  grid.innerHTML = '';
  tokens.forEach(t => grid.appendChild(buildCoinCard(t)));
}

/* ============================================================
   UI STATE
   ============================================================ */
function showLoading() {
  el.skeletons()?.classList.remove('hidden');
  el.loadingText()?.classList.remove('hidden');
  el.coinsGrid()?.classList.add('hidden');
  el.error()?.classList.add('hidden');
  setLabel('Scanning...');
}

function showCoins(tokens) {
  renderCoins(tokens);
  el.skeletons()?.classList.add('hidden');
  el.loadingText()?.classList.add('hidden');
  el.coinsGrid()?.classList.remove('hidden');
  el.error()?.classList.add('hidden');
}

function showError(msg) {
  el.skeletons()?.classList.add('hidden');
  el.loadingText()?.classList.add('hidden');
  el.coinsGrid()?.classList.add('hidden');
  el.error()?.classList.remove('hidden');
  const msgEl = el.errorMsg();
  if (msgEl) msgEl.textContent = msg || 'Even the blockchain is ignoring you.';
}

function setLabel(text) {
  const el_ = el.updatedLabel();
  if (el_) el_.textContent = text;
}

/* ============================================================
   COUNTER — "Updated X seconds ago"
   ============================================================ */
function startCounter() {
  stopCounter();
  state.counterId = setInterval(() => {
    if (state.destroyed) { stopCounter(); return; }
    if (state.lastFetchTime) {
      setLabel('Updated ' + timeAgo(state.lastFetchTime));
    }
  }, 5_000);
}

function stopCounter() {
  if (state.counterId != null) {
    clearInterval(state.counterId);
    state.counterId = null;
  }
}

/* ============================================================
   REFRESH
   ============================================================ */
async function doRefresh(isManual = false) {
  if (state.destroyed) return;

  if (isManual && state.lastManualAt) {
    const elapsed = Date.now() - state.lastManualAt.getTime();
    if (elapsed < MANUAL_COOLDOWN_MS) {
      setLabel(`Wait ${Math.ceil((MANUAL_COOLDOWN_MS - elapsed) / 1000)}s...`);
      return;
    }
  }

  if (isManual) {
    state.lastManualAt = new Date();
    const btn = el.refreshBtn();
    if (btn) {
      btn.classList.add('spinning', 'cooldown');
      setTimeout(() => btn.classList.remove('spinning'), 650);
      setTimeout(() => btn.classList.remove('cooldown'), MANUAL_COOLDOWN_MS);
    }
  }

  // First load → show skeleton. Subsequent → keep current cards, just update label.
  if (!state.lastFetchTime) {
    showLoading();
  } else {
    setLabel('Refreshing...');
  }

  try {
    const tokens = await fetchTrendingData();
    if (state.destroyed) return;

    state.coins         = tokens;
    state.lastFetchTime = new Date();

    showCoins(tokens);
    setLabel('Updated just now');
    startCounter();

  } catch (err) {
    if (state.destroyed) return;
    console.error(`${LOG} All sources failed:`, err);

    if (state.coins.length === 0) {
      showError('Even the blockchain is ignoring you.');
    } else {
      // Keep existing data; only update the label
      setLabel('Refresh failed — retrying');
    }
  }
}

/* ============================================================
   INTERVAL MANAGEMENT
   ============================================================ */
function startAutoRefresh() {
  stopAutoRefresh();
  state.intervalId = setInterval(() => {
    if (!state.destroyed) doRefresh(false);
  }, REFRESH_INTERVAL_MS);
}

function stopAutoRefresh() {
  if (state.intervalId != null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

/* ============================================================
   CLEANUP
   ============================================================ */
function destroyScanner() {
  state.destroyed = true;
  stopAutoRefresh();
  stopCounter();
  console.log(`${LOG} Destroyed — all intervals cleared.`);
}

/* ============================================================
   BOOT
   ============================================================ */
function bootScanner() {
  state.destroyed     = false;
  state.coins         = [];
  state.lastFetchTime = null;
  state.lastManualAt  = null;

  // Wire buttons
  el.retryBtn()?.addEventListener('click', () => doRefresh(false));
  el.refreshBtn()?.addEventListener('click', () => doRefresh(true));

  // Kick off
  doRefresh(false);
  startAutoRefresh();
}

/* ============================================================
   PAGE LIFECYCLE
   ============================================================ */
document.addEventListener('DOMContentLoaded', bootScanner);

window.addEventListener('pagehide',     destroyScanner);
window.addEventListener('beforeunload', destroyScanner);

// bfcache restore (browser back button)
window.addEventListener('pageshow', e => {
  if (e.persisted) {
    state.destroyed = false;
    stopAutoRefresh();
    stopCounter();
    bootScanner();
  }
});
