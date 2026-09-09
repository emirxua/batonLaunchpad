/**
 * $BATON Pro Alpha Terminal — app.js (v5.0)
 * 100% Real Live On-Chain Data • Zero Mock Data
 * Baton Corporation Ltd • The Origin of Pump.fun
 */

'use strict';

/* ==========================================================================
   CONFIG & CONSTANTS
   ========================================================================== */
const BATON_CA = '2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump';
const BATON_PAIR_SLUG = '5wg14qetnz2xo1rbccdud7pyqkbko2luj8nmrtpwimmx';

const STATS_INTERVAL_MS = 2_500;
const CALLOUTS_INTERVAL_MS = 2_000;
const DEX_SYNC_INTERVAL_MS = 2_500;
const TRENDING_INTERVAL_MS = 5_000;

/* ==========================================================================
   STATE
   ========================================================================== */
const state = {
  activeTab: 'tab-coin',
  audioAlerts: true,
  misPriceUsd: 0.00000781,
  solPriceUsd: 135.0,

  // Active Surveillance Radar target
  radarMint: BATON_CA,
  radarSymbol: '$BATON',
  radarName: 'Baton Corporation Ltd',
  radarImg: 'assets/baton-main.jpg',
  radarPrice: '—',
  radarChange: '—',
  radarChangeCls: 'change-neutral',
  radarMcap: '—',
  radarVol: '—',
  radarLiq: '100% Burned LP (PumpSwap)',

  // Live callouts
  callouts: [],
  knownCalloutIds: new Set(),
  calloutFilter: 'all',
  calloutSearch: '',

  // Trending
  trendingTokens: [],
  trendingFilter: 'all',
  trendingSearch: '',
};

/* ==========================================================================
   DOM ELEMENTS CACHE
   ========================================================================== */

const dom = {
  brandHomeBtn: document.getElementById('brandHomeBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),

  // Header Ticker
  tickerPrice: document.getElementById('tickerPrice'),
  tickerChange: document.getElementById('tickerChange'),
  tickerMcap: document.getElementById('tickerMcap'),
  tickerVol: document.getElementById('tickerVol'),
  headerCopyBtn: document.getElementById('headerCopyCaBtn'),
  signalAudioBtn: document.getElementById('signalAudioBtn'),
  audioIconOn: document.getElementById('audioIconOn'),
  audioIconOff: document.getElementById('audioIconOff'),

  // Telemetry Bar
  heroSignalsCount: document.getElementById('heroSignalsCount'),
  heroMaxMultVal: document.getElementById('heroMaxMultVal'),
  heroLiqVal: document.getElementById('heroLiqVal'),

  // Tab Navigation
  tabButtons: document.querySelectorAll('.tab-btn'),
  panes: document.querySelectorAll('.stage-pane'),
  deckRefreshBtn: document.getElementById('deckRefreshBtn'),

  // Callouts
  calloutsGrid: document.getElementById('calloutsGrid'),
  calloutsEmpty: document.getElementById('calloutsEmptyState'),
  calloutFilters: document.getElementById('calloutFilters'),
  calloutSearchInput: document.getElementById('calloutSearchInput'),
  calloutCountBadge: document.getElementById('calloutCountBadge'),

  // Trending
  trendingGrid: document.getElementById('trendingGrid'),
  trendingFilters: document.getElementById('trendingFilters'),
  trendingSearchInput: document.getElementById('trendingSearchInput'),

  // Radar Sidebar (Pure Observation)
  sidebarRadar: document.getElementById('sidebarRadar'),
  radarTargetImg: document.getElementById('radarTargetImg'),
  radarTargetSymbol: document.getElementById('radarTargetSymbol'),
  radarTargetName: document.getElementById('radarTargetName'),
  radarTargetCa: document.getElementById('radarTargetCa'),
  copyRadarCaBtn: document.getElementById('copyRadarCaBtn'),
  radarPrice: document.getElementById('radarPrice'),
  radarChange: document.getElementById('radarChange'),
  radarMcap: document.getElementById('radarMcap'),
  radarVol: document.getElementById('radarVol'),
  radarLiq: document.getElementById('radarLiq'),
  radarOpenChartBtn: document.getElementById('radarOpenChartBtn'),
  radarDexLink: document.getElementById('radarDexLink'),
  radarSolscanLink: document.getElementById('radarSolscanLink'),
  radarPumpLink: document.getElementById('radarPumpLink'),

  // Modal & Toast
  chartModal: document.getElementById('chartModal'),
  modalChartTitle: document.getElementById('modalChartTitle'),
  dexChartIframe: document.getElementById('dexChartIframe'),
  toast: document.getElementById('termToast'),

  // Mobile Dock
  dockButtons: document.querySelectorAll('.dock-btn'),
};

/* ==========================================================================
   DAY / NIGHT (LIGHT / DARK) SYSTEM THEME ENGINE
   ========================================================================== */
function initThemeEngine() {
  const root = document.documentElement;
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(isDark) {
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }

  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    applyTheme(storedTheme === 'dark');
  } else {
    applyTheme(darkQuery.matches);
  }

  // Follow system theme changes automatically if user hasn't hardcoded a choice
  darkQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches);
    }
  });

  // Manual Toggle Button
  if (dom.themeToggleBtn) {
    dom.themeToggleBtn.addEventListener('click', () => {
      const isCurrentlyDark = root.classList.contains('dark');
      const nextIsDark = !isCurrentlyDark;
      applyTheme(nextIsDark);
      localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
      showToast(nextIsDark ? '🌙 Night Mode Activated' : '☀️ Day Mode Activated');
    });
  }
}


/* ==========================================================================
   FORMATTING & UTILITIES
   ========================================================================== */
function fmtUSD(num) {
  if (num == null || isNaN(num) || num === 0) return '$0.00';
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'K';
  if (num >= 1) return '$' + num.toFixed(2);
  if (num >= 0.01) return '$' + num.toFixed(2);
  if (num < 0.000001) return '$' + num.toFixed(8);
  return '$' + num.toFixed(6);
}

function fmtMcap(num) {
  if (num == null || isNaN(num) || num <= 0) return '—';
  if (num >= 1e9) return '$' + (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return '$' + (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return '$' + (num / 1e3).toFixed(1) + 'K';
  return '$' + Math.round(num).toLocaleString('en-US');
}

function fmtPercent(num) {
  if (num == null || isNaN(num)) return { text: '0.00%', cls: 'change-neutral' };
  const sign = num > 0 ? '+' : '';
  const cls = num > 0 ? 'change-up' : num < 0 ? 'change-down' : 'change-neutral';
  return { text: `${sign}${Number(num).toFixed(2)}%`, cls };
}

function fmtShortAddr(addr) {
  if (!addr) return '';
  const s = String(addr).trim();
  if (s.length <= 8) return s;
  return s.slice(0, 4) + '...' + s.slice(-4);
}

function timeAgo(dateOrMs) {
  if (!dateOrMs) return 'just now';
  const time = typeof dateOrMs === 'number' ? dateOrMs : new Date(dateOrMs).getTime();
  const diffSec = Math.max(1, Math.floor((Date.now() - time) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function sanitizeUrl(url) {
  if (!url) return '';
  let clean = url.trim();
  if (clean.includes('ipfs.io/ipfs/')) {
    clean = clean.replace('https://ipfs.io/ipfs/', 'https://cf-ipfs.com/ipfs/');
  }
  return clean;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function linkifyThesis(text) {
  if (!text) return '';
  const escaped = escapeHtml(text);
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return escaped.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="thesis-link" onclick="event.stopPropagation()">${url}</a>`;
  });
}

// Generate deterministic styling for token avatar badges
function getTokenGradient(symbol) {
  const styles = [
    'background: #18181b; border: 1px solid rgba(255,85,0,0.4); color: #ff5500;',
    'background: #27272a; border: 1px solid rgba(255,255,255,0.15); color: #ffffff;',
    'background: #1c1917; border: 1px solid rgba(255,119,0,0.4); color: #ff7700;',
    'background: #09090b; border: 1px solid #3f3f46; color: #ffffff;',
    'background: #18181b; border: 1px solid #52525b; color: #f4f4f5;',
  ];
  let hash = 0;
  for (let i = 0; i < (symbol || '').length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return styles[Math.abs(hash) % styles.length];
}

/* ==========================================================================
   TOAST & AUDIO FEEDBACK
   ========================================================================== */
let toastTimer = null;
function showToast(message) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  dom.toast.style.cursor = 'pointer';
  dom.toast.title = 'Click to view latest signal';
  dom.toast.onclick = () => {
    switchTab('tab-callouts');
    state.calloutFilter = 'all';
    state.calloutSearch = '';
    const allChip = document.querySelector('.chip-item[data-filter="all"]');
    if (allChip) {
      document.querySelectorAll('.chip-item').forEach((c) => c.classList.remove('active'));
      allChip.classList.add('active');
    }
    renderCalloutsGrid();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, 2600);
}

function playSignalChime() {
  if (!state.audioAlerts) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  } catch {}
}

/* ==========================================================================
   CLIPBOARD
   ========================================================================== */
async function copyToClipboard(text, label = 'Contract Address') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`✓ Copied ${label}!`);
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast(`✓ Copied ${label}!`);
  }
}

function copyMainCA() {
  copyToClipboard(BATON_CA, '$BATON CA');

  // Visual feedback on intro copy button
  const introTxt = document.getElementById('introCopyTxt');
  const introBtn = document.getElementById('introCopyCaBtn');
  if (introTxt && introBtn) {
    const prev = introTxt.textContent;
    introTxt.textContent = 'COPIED! ✓';
    introBtn.classList.add('copied');
    setTimeout(() => {
      introTxt.textContent = prev;
      introBtn.classList.remove('copied');
    }, 2000);
  }

  // Visual feedback on showcase buttons
  const glowBtns = document.querySelectorAll('.btn-ca-copy-glow');
  glowBtns.forEach((btn) => {
    btn.classList.add('copied');
    const span = btn.querySelector('span');
    if (span) {
      const original = span.textContent;
      span.textContent = 'COPIED! ✓';
      setTimeout(() => {
        span.textContent = original;
        btn.classList.remove('copied');
      }, 2000);
    }
  });
}

/* ==========================================================================
   1. REAL-TIME $BATON STATS POLLING (ZERO MOCK DATA)
   ========================================================================== */
async function fetchTokenStats() {
  try {
    let pairData = null;

    // 1. Try local server endpoint
    try {
      const res = await fetch('/api/token-stats', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) pairData = json;
      }
    } catch {}

    // 2. Direct DexScreener fallback
    if (!pairData) {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${BATON_CA}`);
      if (res.ok) {
        const json = await res.json();
        const p = (json.pairs || [])[0];
        if (p) {
          pairData = {
            priceUsd: parseFloat(p.priceUsd || 0),
            marketCap: parseFloat(p.marketCap || p.fdv || 0),
            volume24h: parseFloat(p.volume?.h24 || 0),
            priceChange24h: parseFloat(p.priceChange?.h24 || 0),
            liquidityUsd: parseFloat(p.liquidity?.usd || 0),
          };
        }
      }
    }

    if (pairData && pairData.priceUsd > 0) {
      state.misPriceUsd = pairData.priceUsd;
      const chg = fmtPercent(pairData.priceChange24h);

      if (dom.tickerPrice) dom.tickerPrice.textContent = fmtUSD(pairData.priceUsd);
      if (dom.tickerChange) {
        dom.tickerChange.textContent = chg.text;
        dom.tickerChange.className = `seg-val ${chg.cls}`;
      }
      if (dom.tickerMcap) dom.tickerMcap.textContent = fmtMcap(pairData.marketCap);
      if (dom.tickerVol) dom.tickerVol.textContent = fmtUSD(pairData.volume24h);
      if (dom.heroLiqVal) dom.heroLiqVal.textContent = 'Pump.fun Coin (100% Burned)';

      if (state.radarMint === BATON_CA) {
        state.radarPrice = fmtUSD(pairData.priceUsd);
        state.radarChange = chg.text;
        state.radarChangeCls = chg.cls;
        state.radarMcap = fmtMcap(pairData.marketCap);
        state.radarVol = fmtUSD(pairData.volume24h);
        state.radarLiq = '100% Burned LP (PumpSwap)';
        updateRadarDOM();
      }
    }
  } catch (err) {
    console.warn('[Terminal] Stats error:', err);
  }
}

/* ==========================================================================
   2. REAL-TIME ALPHA CALLOUTS STREAM (ZERO MOCK DATA)
   ========================================================================== */
let isFirstCalloutsLoad = true;
let isSyncingDexPrices = false;

function getCalloutTimestamp(c) {
  if (!c) return 0;
  if (c._arrivalTimestamp) return c._arrivalTimestamp;
  const t = c.createdAt || c.timestamp || c.date || c.maxMultiplierAt;
  if (typeof t === 'number') return t;
  if (typeof t === 'string') {
    const n = Number(t);
    if (!isNaN(n) && n > 0) return n;
    const p = Date.parse(t);
    if (!isNaN(p) && p > 0) return p;
  }
  return 0;
}

function sortCalloutsNewestFirst(list) {
  return [...list].sort((a, b) => {
    if (a._isNewArrival && !b._isNewArrival) return -1;
    if (!a._isNewArrival && b._isNewArrival) return 1;
    if (a._isNewArrival && b._isNewArrival) {
      return (b._arrivalTimestamp || 0) - (a._arrivalTimestamp || 0);
    }
    return getCalloutTimestamp(b) - getCalloutTimestamp(a);
  });
}

function updateLiveTimestamps() {
  const cards = document.querySelectorAll('.callout-card');
  cards.forEach((card) => {
    const timeEl = card.querySelector('.callout-time');
    const created = Number(card.getAttribute('data-created') || 0);
    if (timeEl && created > 0) {
      timeEl.textContent = timeAgo(created);
    }
  });
}

async function fetchCallouts() {
  try {
    let rawCallouts = [];
    const cacheBuster = `_t=${Date.now()}`;

    // 1. Local / Vercel proxy endpoint with timestamp cache-buster
    try {
      const res = await fetch(`/api/callouts?${cacheBuster}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        rawCallouts = data.callouts || [];
      }
    } catch {}

    // 2. Upstream fallback with cache-buster
    if (!rawCallouts || rawCallouts.length === 0) {
      try {
        const res = await fetch(`https://www.outbid.bond/api/callouts?${cacheBuster}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          rawCallouts = data.callouts || [];
        }
      } catch {}
    }

    if (!rawCallouts || rawCallouts.length === 0) return;

    // Strictly sort newest first
    rawCallouts = sortCalloutsNewestFirst(rawCallouts);

    // Detect new incoming calls
    const newlyArrived = [];
    rawCallouts.forEach((c) => {
      const id = c.calloutId || (c.coinMint + '_' + (c.createdAt || ''));
      if (id && !state.knownCalloutIds.has(id)) {
        if (!isFirstCalloutsLoad) {
          c._isNewArrival = true;
          c._arrivalTimestamp = Date.now();
          newlyArrived.push(c);
        }
        state.knownCalloutIds.add(id);
      }
    });

    // Alert user if new signals arrived and prepend them directly to the top
    if (newlyArrived.length > 0) {
      playSignalChime();
      const topNew = newlyArrived[0];
      const caller = topNew.callerLabel || (topNew.callerXUsername ? '@' + topNew.callerXUsername : 'Caller');
      const sym = (topNew.coinSymbol || 'TOKEN').toUpperCase();
      showToast(`🚨 NEW SIGNAL: $${sym} by ${caller}`);

      // Prepend newly arrived items directly so they appear at position #1
      const newIds = new Set(newlyArrived.map((n) => n.calloutId || (n.coinMint + '_' + (n.createdAt || ''))));
      const existing = rawCallouts.filter((c) => !newIds.has(c.calloutId || (c.coinMint + '_' + (c.createdAt || ''))));
      rawCallouts = [...newlyArrived, ...existing];
    } else {
      rawCallouts = sortCalloutsNewestFirst(rawCallouts);
    }

    // Preserve previously synced live Dex prices so they don't revert
    if (state.callouts && state.callouts.length > 0) {
      const prevMap = new Map();
      state.callouts.forEach((c) => {
        if (c.coinMint) prevMap.set(c.coinMint, c);
      });
      rawCallouts.forEach((c) => {
        const prev = prevMap.get(c.coinMint);
        if (prev && prev._liveDexPrice) {
          c._liveDexPrice = prev._liveDexPrice;
          c._liveDexMcap = prev._liveDexMcap;
          c._liveDexMult = prev._liveDexMult;
        }
      });
    }

    const prevTopKey = state.callouts[0]?.calloutId || (state.callouts[0]?.coinMint + '_' + state.callouts[0]?.createdAt);
    const newTopKey = rawCallouts[0]?.calloutId || (rawCallouts[0]?.coinMint + '_' + rawCallouts[0]?.createdAt);
    const countChanged = state.callouts.length !== rawCallouts.length;
    const topChanged = prevTopKey !== newTopKey;

    state.callouts = rawCallouts;
    isFirstCalloutsLoad = false;

    if (dom.heroSignalsCount) {
      dom.heroSignalsCount.textContent = `${state.callouts.length} Signals`;
    }

    let maxMult = 0;
    state.callouts.forEach((c) => {
      const mult = Number(c._liveDexMult || c.multiplier || c.multiple || 1);
      if (mult > maxMult) maxMult = mult;
    });

    if (dom.heroMaxMultVal && maxMult > 0) {
      dom.heroMaxMultVal.textContent = `${maxMult.toFixed(1)}x`;
    }

    // Re-render grid if top callout changed, count changed, new arrivals exist, or empty
    if (topChanged || countChanged || newlyArrived.length > 0 || !dom.calloutsGrid.hasChildNodes()) {
      renderCalloutsGrid();
    }

    // Immediately trigger live DexScreener price sync for active cards
    syncLiveDexPricesForCallouts();

  } catch (err) {
    console.warn('[Terminal] Callouts error:', err);
  }
}

/* --------------------------------------------------------------------------
   LIVE DEXSCREENER PRICE SYNC FOR DISPLAYED CARDS
   -------------------------------------------------------------------------- */
async function syncLiveDexPricesForCallouts() {
  if (isSyncingDexPrices) return;
  if (!state.callouts || state.callouts.length === 0) return;

  isSyncingDexPrices = true;
  try {
    const mints = [...new Set(state.callouts.slice(0, 20).map((c) => c.coinMint).filter(Boolean))];
    if (mints.length === 0) return;

    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mints.join(',')}`, {
      cache: 'no-store'
    });
    if (!res.ok) return;

    const data = await res.json();
    const pairs = data.pairs || [];
    if (pairs.length === 0) return;

    // Pick pair with highest liquidity per mint
    const pairMap = new Map();
    pairs.forEach((p) => {
      const mint = p.baseToken?.address;
      if (!mint) return;
      const current = pairMap.get(mint);
      const liq = parseFloat(p.liquidity?.usd || 0);
      if (!current || liq > parseFloat(current.liquidity?.usd || 0)) {
        pairMap.set(mint, p);
      }
    });

    // Update in-memory state and DOM elements directly
    state.callouts.forEach((c) => {
      const pair = pairMap.get(c.coinMint);
      if (!pair) return;

      const livePrice = parseFloat(pair.priceUsd || 0);
      const liveMcap = parseFloat(pair.marketCap || pair.fdv || 0);
      if (livePrice <= 0) return;

      c._liveDexPrice = livePrice;
      if (liveMcap > 0) {
        c._liveDexMcap = liveMcap;
        const entryMcap = Number(c.entryMcap || 0);
        if (entryMcap > 0) {
          c._liveDexMult = liveMcap / entryMcap;
        }
      }

      updateAllCardsForToken(c.coinMint, livePrice, liveMcap);
    });

  } catch (err) {
    // Non-blocking
  } finally {
    isSyncingDexPrices = false;
  }
}

function updateAllCardsForToken(mint, livePrice, liveMcap) {
  const cards = document.querySelectorAll(`.callout-card[data-mint="${mint}"]`);
  cards.forEach((card) => {
    const entryMcap = parseFloat(card.getAttribute('data-entry-mcap') || 0);
    const origMult = parseFloat(card.getAttribute('data-orig-mult') || 1);
    const liveMult = (entryMcap > 0 && liveMcap > 0) ? (liveMcap / entryMcap) : origMult;
    const multText = liveMult.toFixed(2) + 'x';
    const multClass = liveMult >= 5.0 ? 'mult-super' : liveMult >= 1.0 ? 'mult-up' : 'mult-down';
    const isGain = liveMult >= 1.0;

    // 1. Update Multiplier Badge
    const badgeEl = card.querySelector('.multiplier-badge');
    if (badgeEl) {
      badgeEl.textContent = multText;
      badgeEl.className = `multiplier-badge ${multClass}`;
    }

    // 2. Update Gain/Loss Label
    const labelEl = card.querySelector('.mult-label');
    if (labelEl) {
      labelEl.textContent = isGain ? 'GAIN' : 'LOSS';
      labelEl.className = `mult-label ${isGain ? 'color-green' : 'color-red'}`;
    }

    // 3. Update DEX Price with tick animation
    const priceValEl = card.querySelector('.stat-dex-price');
    if (priceValEl && livePrice > 0) {
      const prevPrice = parseFloat(priceValEl.getAttribute('data-raw') || 0);
      const newFormatted = fmtUSD(livePrice);
      if (prevPrice > 0 && Math.abs(livePrice - prevPrice) > 1e-10) {
        priceValEl.classList.remove('flash-green', 'flash-red');
        void priceValEl.offsetWidth; // Force CSS reflow
        priceValEl.classList.add(livePrice >= prevPrice ? 'flash-green' : 'flash-red');
      }
      priceValEl.setAttribute('data-raw', livePrice);
      priceValEl.textContent = newFormatted;
    }

    // 4. Update Current Market Cap
    const mcapValEl = card.querySelector('.stat-curr-mcap');
    if (mcapValEl && liveMcap > 0) {
      mcapValEl.textContent = fmtMcap(liveMcap);
      mcapValEl.className = `value stat-curr-mcap ${liveMcap >= entryMcap ? 'color-green' : 'color-red'}`;
    }

    // 5. Update Time Ago dynamically
    const timeEl = card.querySelector('.callout-time');
    const created = Number(card.getAttribute('data-created') || 0);
    if (timeEl && created > 0) {
      timeEl.textContent = timeAgo(created);
    }
  });
}

function renderCalloutsGrid() {
  if (!dom.calloutsGrid) return;

  // STRICTLY SORT NEWEST FIRST!
  let filtered = sortCalloutsNewestFirst(state.callouts);

  // Filter chips
  if (state.calloutFilter === '2x') {
    filtered = filtered.filter((c) => (c._liveDexMult || c.multiplier || c.multiple || 1) >= 2.0);
  } else if (state.calloutFilter === '5x') {
    filtered = filtered.filter((c) => (c._liveDexMult || c.multiplier || c.multiple || 1) >= 5.0);
  } else if (state.calloutFilter === '10x') {
    filtered = filtered.filter((c) => (c._liveDexMult || c.multiplier || c.multiple || 1) >= 10.0);
  } else if (state.calloutFilter === 'recent') {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    filtered = filtered.filter((c) => getCalloutTimestamp(c) >= oneHourAgo);
  }

  // Text search
  if (state.calloutSearch.trim()) {
    const q = state.calloutSearch.toLowerCase().trim();
    filtered = filtered.filter((c) => {
      const sym = (c.coinSymbol || '').toLowerCase();
      const name = (c.coinName || '').toLowerCase();
      const caller = (c.callerLabel || c.callerXUsername || c.callerWallet || '').toLowerCase();
      const mint = (c.coinMint || '').toLowerCase();
      return sym.includes(q) || name.includes(q) || caller.includes(q) || mint.includes(q);
    });
  }

  // Ensure filtered is always strictly sorted newest first
  filtered = sortCalloutsNewestFirst(filtered);

  if (dom.calloutCountBadge) {
    dom.calloutCountBadge.innerHTML = `<span class="live-dot-beacon"></span>${filtered.length}`;
  }

  if (filtered.length === 0) {
    dom.calloutsGrid.innerHTML = '';
    if (dom.calloutsEmpty) dom.calloutsEmpty.classList.remove('hidden');
    return;
  }

  if (dom.calloutsEmpty) dom.calloutsEmpty.classList.add('hidden');

  const now = Date.now();
  const html = filtered.map((c) => {
    const mint = c.coinMint || '';
    const sym = (c.coinSymbol || 'TOKEN').toUpperCase();
    const name = c.coinName || sym;
    const createdAt = getCalloutTimestamp(c);
    const calloutId = c.calloutId || (mint + '_' + createdAt);

    const mult = Number(c._liveDexMult || c.multiplier || c.multiple || 1);
    const multText = mult.toFixed(2) + 'x';
    const multClass = mult >= 5.0 ? 'mult-super' : mult >= 1.0 ? 'mult-up' : 'mult-down';
    const isGain = mult >= 1.0;

    const entryMcap = Number(c.entryMcap || c.marketCap || 0);
    const currMcap = Number(c._liveDexMcap || c.currentMcap || c.marketCap || 0);
    const dexPrice = Number(c._liveDexPrice || c.currentPriceUsd || c.calloutPriceUsd || c.priceUsd || 0);
    const dexPriceFormatted = dexPrice > 0 ? fmtUSD(dexPrice) : '—';

    const isFresh = c._isNewArrival || (createdAt > 0 && (now - createdAt) < 300000); // 5 mins fresh

    const callerName = c.callerLabel || (c.callerXUsername ? '@' + c.callerXUsername : fmtShortAddr(c.callerWallet));
    const callerInitial = (callerName.replace('@', '')[0] || 'A').toUpperCase();
    const callerAvatar = sanitizeUrl(c.callerAvatarUrl);
    const coinImg = sanitizeUrl(c.mediaUrl);
    const tokenInitials = sym.slice(0, 2);
    const tokenGrad = getTokenGradient(sym);

    const rawThesis = c.thesis ? `“${c.thesis}”` : 'Live Solana alpha signal detected in the trenches.';
    const formattedThesis = linkifyThesis(rawThesis);
    const xLink = c.callerXUsername ? `https://x.com/${c.callerXUsername}` : null;
    const dexUrl = `https://dexscreener.com/solana/${mint}`;
    const pumpUrl = `https://pump.fun/coin/${mint}`;

    return `
      <div class="callout-card ${c._isNewArrival ? 'is-new-arrival' : ''}" data-callout-id="${calloutId}" data-mint="${mint}" data-entry-mcap="${entryMcap}" data-orig-mult="${c.multiplier || c.multiple || 1}" data-created="${createdAt}">
        <!-- Caller Row -->
        <div class="card-caller-row">
          <div class="caller-identity">
            ${callerAvatar ? `
              <img class="caller-avatar" src="${callerAvatar}" alt="${callerName}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="caller-fallback-badge" style="display:none;">${callerInitial}</div>
            ` : `
              <div class="caller-fallback-badge">${callerInitial}</div>
            `}
            <div class="caller-name-wrap">
              ${xLink ? `
                <a href="${xLink}" target="_blank" rel="noopener noreferrer" class="caller-name caller-name-link" title="Caller X Profile">${callerName} 𝕏</a>
              ` : `
                <span class="caller-name">${callerName}</span>
              `}
              ${c._isNewArrival ? `<span class="badge-new-live badge-new-flash"><span class="pulse-radar-dot"></span> NEW SIGNAL</span>` : (isFresh ? `<span class="badge-new-live"><span class="pulse-dot"></span> LIVE</span>` : '')}
            </div>
          </div>
          <span class="callout-time">${c._isNewArrival ? 'Just now' : timeAgo(createdAt)}</span>
        </div>

        <!-- Token Banner (Direct Callout Link to DexScreener) -->
        <a href="${dexUrl}" target="_blank" rel="noopener noreferrer" class="card-token-banner" title="Inspect $${sym} on DexScreener">
          <div class="token-info-left">
            ${coinImg ? `
              <img class="token-avatar" src="${coinImg}" alt="${sym}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="token-fallback-avatar" style="display:none; ${tokenGrad}">${tokenInitials}</div>
            ` : `
              <div class="token-fallback-avatar" style="${tokenGrad}">${tokenInitials}</div>
            `}
            <div class="token-titles">
              <div class="token-symbol-row">
                <span class="token-symbol-text">$${sym}</span>
                <span class="token-badge">pump</span>
              </div>
              <span class="token-name-text">${name}</span>
            </div>
          </div>

          <!-- Multiplier Hero Badge (Accurate GAIN vs LOSS) -->
          <div class="multiplier-hero-pill">
            <span class="multiplier-badge ${multClass}">${multText}</span>
            <span class="mult-label ${isGain ? 'color-green' : 'color-red'}">${isGain ? 'GAIN' : 'LOSS'}</span>
          </div>
        </a>

        <!-- Real DEX Telemetry Stats Row -->
        <div class="callout-stats-row">
          <div class="stat-item">
            <span class="label">DEX PRICE</span>
            <span class="value font-mono stat-dex-price" data-raw="${dexPrice}">${dexPriceFormatted}</span>
          </div>
          <div class="stat-item">
            <span class="label">ENTRY MCAP</span>
            <span class="value">${fmtMcap(entryMcap)}</span>
          </div>
          <div class="stat-item">
            <span class="label">CURRENT MCAP</span>
            <span class="value stat-curr-mcap ${currMcap >= entryMcap ? 'color-green' : 'color-red'}">${fmtMcap(currMcap)}</span>
          </div>
        </div>

        <!-- Caller Thesis Note (Clickable Links & Zero Overflow) -->
        <div class="callout-thesis-box">
          <p>${formattedThesis}</p>
        </div>

        <!-- Card Action Footer (All Direct Callout Links) -->
        <div class="card-actions-footer">
          <button type="button" class="card-mint-btn" onclick="copyToClipboard('${mint}', '${sym} Mint')" title="Copy CA (${mint})">
            <span>${fmtShortAddr(mint)}</span>
          </button>

          <div class="card-links-group">
            <button type="button" class="card-btn-chart" onclick="openChartModal('${mint}', '${sym}')" title="Live DexScreener Chart Modal">
              Chart ↗
            </button>
            <a href="${dexUrl}" target="_blank" rel="noopener noreferrer" class="card-btn-dex" title="Open DexScreener">
              Dex ↗
            </a>
            <a href="${pumpUrl}" target="_blank" rel="noopener noreferrer" class="card-btn-pump" title="Open Pump.fun">
              Pump ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  dom.calloutsGrid.innerHTML = html;
}

function resetCalloutFilters() {
  state.calloutFilter = 'all';
  state.calloutSearch = '';
  if (dom.calloutSearchInput) dom.calloutSearchInput.value = '';
  if (dom.calloutFilters) {
    dom.calloutFilters.querySelectorAll('.chip-item').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-filter') === 'all');
    });
  }
  renderCalloutsGrid();
}

/* ==========================================================================
   3. REAL-TIME TRENDING TOKENS SCANNER (ZERO MOCK DATA)
   ========================================================================== */
async function fetchTrending() {
  try {
    let coins = [];

    // Local / Netlify proxy endpoint
    try {
      const res = await fetch('/api/trending', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        coins = json.data || [];
      }
    } catch {}

    // Direct fallback
    if (!coins || coins.length === 0) {
      try {
        const res = await fetch('https://www.outbid.bond/api/coins');
        if (res.ok) {
          const json = await res.json();
          coins = json.data || (Array.isArray(json) ? json : []);
        }
      } catch {}
    }

    if (coins && coins.length > 0) {
      state.trendingTokens = coins;
      renderTrendingGrid();
    }
  } catch (err) {
    console.warn('[Terminal] Trending error:', err);
  }
}

function renderTrendingGrid() {
  if (!dom.trendingGrid) return;

  let list = [...state.trendingTokens];

  if (state.trendingFilter === 'gainers') {
    list.sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
  } else if (state.trendingFilter === 'volume') {
    list.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
  } else if (state.trendingFilter === 'mcap') {
    list.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  }

  if (state.trendingSearch.trim()) {
    const q = state.trendingSearch.toLowerCase().trim();
    list = list.filter((c) => {
      const sym = (c.ticker || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      return sym.includes(q) || name.includes(q);
    });
  }

  const html = list.map((c) => {
    const mint = c.mintAddress || '';
    const sym = (c.ticker || 'SOL').toUpperCase();
    const name = c.name || sym;
    const price = fmtUSD(c.priceUsd);
    const mcap = fmtMcap(c.marketCap);
    const vol = fmtUSD(c.volume24h);
    const chg = fmtPercent(c.change24h);
    const img = sanitizeUrl(c.imageUrl);
    const tokenInitials = sym.slice(0, 2);
    const tokenGrad = getTokenGradient(sym);

    const dexUrl = `https://dexscreener.com/solana/${mint}`;
    const pumpUrl = `https://pump.fun/coin/${mint}`;

    return `
      <div class="trend-card" data-mint="${mint}">
        <a href="${dexUrl}" target="_blank" rel="noopener noreferrer" class="trend-head-row" title="Inspect $${sym} on DexScreener">
          <div class="trend-token-left">
            ${img ? `
              <img class="trend-avatar" src="${img}" alt="${sym}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <div class="trend-fallback-avatar" style="display:none; ${tokenGrad}">${tokenInitials}</div>
            ` : `
              <div class="trend-fallback-avatar" style="${tokenGrad}">${tokenInitials}</div>
            `}
            <div class="trend-titles">
              <span class="trend-symbol">$${sym}</span>
              <span class="trend-name">${name}</span>
            </div>
          </div>
          <span class="trend-chg-badge ${chg.cls}">${chg.text}</span>
        </a>

        <div class="trend-stats-grid">
          <div class="stat-item">
            <span class="label">PRICE</span>
            <span class="value">${price}</span>
          </div>
          <div class="stat-item">
            <span class="label">MCAP</span>
            <span class="value">${mcap}</span>
          </div>
          <div class="stat-item">
            <span class="label">24H VOL</span>
            <span class="value">${vol}</span>
          </div>
          <div class="stat-item">
            <span class="label">MINT</span>
            <span class="value font-mono">${fmtShortAddr(mint)}</span>
          </div>
        </div>

        <div class="card-actions-footer">
          <button type="button" class="card-mint-btn" onclick="copyToClipboard('${mint}', '${sym} Mint')" title="Copy CA (${mint})">
            <span>${fmtShortAddr(mint)}</span>
          </button>
          <div class="card-links-group">
            <button type="button" class="card-btn-chart" onclick="openChartModal('${mint}', '${sym}')" title="Live DexScreener Chart Modal">
              Chart ↗
            </button>
            <a href="${dexUrl}" target="_blank" rel="noopener noreferrer" class="card-btn-dex" title="Open DexScreener">
              Dex ↗
            </a>
            <a href="${pumpUrl}" target="_blank" rel="noopener noreferrer" class="card-btn-pump" title="Open Pump.fun">
              Pump ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  dom.trendingGrid.innerHTML = html;
}

/* ==========================================================================
   4. SIDEBAR RADAR SURVEILLANCE (OBSERVATION TERMINAL ENGINE)
   ========================================================================== */
function updateRadarDOM() {
  if (dom.radarTargetImg) dom.radarTargetImg.src = state.radarImg || 'assets/flower.png';
  if (dom.radarTargetSymbol) dom.radarTargetSymbol.textContent = state.radarSymbol;
  if (dom.radarTargetName) dom.radarTargetName.textContent = state.radarName;
  if (dom.radarTargetCa) dom.radarTargetCa.textContent = fmtShortAddr(state.radarMint);
  if (dom.radarPrice) dom.radarPrice.textContent = state.radarPrice;
  if (dom.radarChange) {
    dom.radarChange.textContent = state.radarChange;
    dom.radarChange.className = `r-val ${state.radarChangeCls}`;
  }
  if (dom.radarMcap) dom.radarMcap.textContent = state.radarMcap;
  if (dom.radarVol) dom.radarVol.textContent = state.radarVol;
  if (dom.radarLiq) dom.radarLiq.textContent = state.radarLiq;

  if (dom.radarDexLink) {
    dom.radarDexLink.href = `https://dexscreener.com/solana/${state.radarMint}`;
  }
  if (dom.radarSolscanLink) {
    dom.radarSolscanLink.href = `https://solscan.io/token/${state.radarMint}`;
  }
  if (dom.radarPumpLink) {
    dom.radarPumpLink.href = `https://pump.fun/coin/${state.radarMint}`;
  }
}

async function inspectTokenRadar(mint, symbol, imgUrl, name, price, chgText, chgCls, mcap, vol) {
  state.radarMint = mint;
  state.radarSymbol = '$' + symbol.replace('$', '');
  state.radarName = name || symbol;
  state.radarImg = imgUrl || 'assets/flower.png';
  state.radarPrice = price || '—';
  state.radarChange = chgText || '—';
  state.radarChangeCls = chgCls || 'change-neutral';
  state.radarMcap = mcap || '—';
  state.radarVol = vol || '—';
  state.radarLiq = (mint === BATON_CA) ? '100% Burned LP' : 'On-Chain';

  updateRadarDOM();
  showToast(`⚡ Radar locked: ${state.radarSymbol}`);

  // Fetch full live pair metrics in background if missing
  if (!price || price === '—') {
    fetchTokenRadarDetails(mint);
  }

  // Scroll to radar on mobile
  if (window.innerWidth <= 1060) {
    scrollToSidebarRadar();
  }
}

async function fetchTokenRadarDetails(mint) {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    if (res.ok) {
      const json = await res.json();
      const p = (json.pairs || [])[0];
      if (p && state.radarMint === mint) {
        state.radarPrice = fmtUSD(p.priceUsd);
        const chg = fmtPercent(p.priceChange?.h24 || 0);
        state.radarChange = chg.text;
        state.radarChangeCls = chg.cls;
        state.radarMcap = fmtMcap(p.marketCap || p.fdv || 0);
        state.radarVol = fmtUSD(p.volume?.h24 || 0);
        state.radarLiq = p.liquidity?.usd ? fmtMcap(p.liquidity.usd) : 'On-Chain';
        updateRadarDOM();
      }
    }
  } catch (err) {
    console.warn('[Radar] Details fetch error:', err);
  }
}

function scrollToSidebarRadar() {
  const sidebar = document.getElementById('sidebarRadar') || document.querySelector('.stage-sidebar');
  if (sidebar) {
    sidebar.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToGame() {
  switchTab('tab-lore');
  setTimeout(() => {
    if (typeof window.handleGameResize === 'function') {
      window.handleGameResize();
    }
    const game = document.getElementById('game');
    if (game) {
      game.scrollIntoView({ behavior: 'smooth' });
    }
  }, 60);
}

/* ==========================================================================
   5. DEXSCREENER CHART MODAL
   ========================================================================== */
function openChartModal(mint, symbol) {
  if (!dom.chartModal || !dom.dexChartIframe) return;
  dom.modalChartTitle.textContent = `${symbol} DexScreener Live Chart`;
  dom.dexChartIframe.src = `https://dexscreener.com/solana/${mint}?embed=1&theme=dark&trades=0&info=0`;
  dom.chartModal.classList.remove('hidden');
}

function closeChartModal() {
  if (!dom.chartModal || !dom.dexChartIframe) return;
  dom.chartModal.classList.add('hidden');
  dom.dexChartIframe.src = '';
}

/* ==========================================================================
   6. EVENT LISTENERS SETUP
   ========================================================================== */
function setupEventListeners() {
  // Brand Logo Home Button: Clicking top-left opens Alpha Callouts (All filter) and scrolls to top
  const brandBtn = dom.brandHomeBtn || document.querySelector('.brand-badge-link');
  if (brandBtn) {
    brandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('tab-callouts');
      resetCalloutFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('⚡ Alpha Callouts: Showing All');
    });
  }

  // CA copy buttons
  if (dom.headerCopyBtn) {
    dom.headerCopyBtn.addEventListener('click', copyMainCA);
  }
  if (dom.copyRadarCaBtn) {
    dom.copyRadarCaBtn.addEventListener('click', () => {
      copyToClipboard(state.radarMint, `${state.radarSymbol} Contract`);
    });
  }

  // Radar Open Live Chart button
  if (dom.radarOpenChartBtn) {
    dom.radarOpenChartBtn.addEventListener('click', () => {
      openChartModal(state.radarMint, state.radarSymbol);
    });
  }

  // Audio button
  if (dom.signalAudioBtn) {
    dom.signalAudioBtn.addEventListener('click', () => {
      state.audioAlerts = !state.audioAlerts;
      if (dom.audioIconOn) dom.audioIconOn.classList.toggle('hidden', !state.audioAlerts);
      if (dom.audioIconOff) dom.audioIconOff.classList.toggle('hidden', state.audioAlerts);
      showToast(state.audioAlerts ? '🔔 Signal Chimes ON' : '🔕 Signal Chimes MUTED');
    });
  }

  // Refresh button
  if (dom.deckRefreshBtn) {
    dom.deckRefreshBtn.addEventListener('click', () => {
      fetchCallouts();
      fetchTrending();
      fetchTokenStats();
      showToast('⚡ Feed Refreshed');
    });
  }

  // Tab navigation
  dom.tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchTab(target);
    });
  });

  // Mobile dock
  dom.dockButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      if (target) {
        switchTab(target);
        dom.dockButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Callout filter chips
  if (dom.calloutFilters) {
    dom.calloutFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-item');
      if (!btn) return;
      dom.calloutFilters.querySelectorAll('.chip-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.calloutFilter = btn.getAttribute('data-filter') || 'all';
      renderCalloutsGrid();
    });
  }

  // Callout search
  if (dom.calloutSearchInput) {
    dom.calloutSearchInput.addEventListener('input', (e) => {
      state.calloutSearch = e.target.value;
      renderCalloutsGrid();
    });
  }

  // Trending filter chips
  if (dom.trendingFilters) {
    dom.trendingFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-item');
      if (!btn) return;
      dom.trendingFilters.querySelectorAll('.chip-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.trendingFilter = btn.getAttribute('data-tfilter') || 'all';
      renderTrendingGrid();
    });
  }

  // Trending search
  if (dom.trendingSearchInput) {
    dom.trendingSearchInput.addEventListener('input', (e) => {
      state.trendingSearch = e.target.value;
      renderTrendingGrid();
    });
  }

  // Escape key closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeChartModal();
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  dom.tabButtons.forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });

  dom.panes.forEach((p) => {
    p.classList.toggle('active', p.id === tabId);
  });

  if (dom.dockButtons) {
    dom.dockButtons.forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });
  }

  if (tabId === 'tab-lore' && typeof window.handleGameResize === 'function') {
    requestAnimationFrame(() => window.handleGameResize());
  }
}

/* ==========================================================================
   IMAGE LIGHTBOX CONTROLLER
   ========================================================================== */
function openImageModal(src, title, link) {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('imageModalImg');
  const titleEl = document.getElementById('imageModalTitle');
  const linkEl = document.getElementById('imageModalLink');
  if (!modal || !img) return;

  img.src = src;
  if (titleEl) titleEl.textContent = title || 'Inspection';
  if (linkEl) {
    if (link) {
      linkEl.href = link;
      linkEl.style.display = 'inline-flex';
    } else {
      linkEl.style.display = 'none';
    }
  }
  modal.classList.remove('hidden');
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (modal) modal.classList.add('hidden');
}

/* ==========================================================================
   INTERACTIVE INTRO GATE CONTROLLER
   ========================================================================== */
function initIntroGate() {
  const gate = document.getElementById('introGate');
  const enterBtn = document.getElementById('introEnterBtn');
  const bar = document.getElementById('introProgressBar');
  if (!gate) return;

  let isDismissed = false;

  function dismissIntro() {
    if (isDismissed) return;
    isDismissed = true;
    gate.classList.add('dismissed');
    setTimeout(() => {
      gate.style.display = 'none';
    }, 320);
  }

  // Smooth auto-enter when bar reaches 100% (3.2 seconds)
  const DURATION_MS = 3200;
  if (bar) {
    bar.style.transition = `width ${DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
    requestAnimationFrame(() => {
      bar.style.width = '100%';
    });

    setTimeout(() => {
      dismissIntro();
    }, DURATION_MS + 100);
  } else {
    setTimeout(dismissIntro, 2500);
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', dismissIntro);
  }

  gate.addEventListener('click', (e) => {
    // If user clicked copy CA or DEX links, don't dismiss immediately
    if (e.target.closest('#introCopyCaBtn') || e.target.closest('.intro-dex-link')) {
      return;
    }
    dismissIntro();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      closeChartModal();
      closeImageModal();
      dismissIntro();
    }
  });
}

/* ==========================================================================
   INIT
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initIntroGate();
  setupEventListeners();

  // Initial polls
  fetchTokenStats();
  fetchCallouts();
  fetchTrending();

  // Background polling intervals
  setInterval(fetchTokenStats, STATS_INTERVAL_MS);
  setInterval(fetchCallouts, CALLOUTS_INTERVAL_MS);
  setInterval(syncLiveDexPricesForCallouts, DEX_SYNC_INTERVAL_MS);
  setInterval(updateLiveTimestamps, 1000);
  setInterval(fetchTrending, TRENDING_INTERVAL_MS);
});

function jumpToCallouts(filter) {
  if (filter) {
    state.calloutFilter = filter;
    if (dom.calloutFilters) {
      dom.calloutFilters.querySelectorAll('.chip-item').forEach((c) => {
        c.classList.toggle('active', c.getAttribute('data-filter') === filter);
      });
    }
    renderCalloutsGrid();
  }
  switchTab('tab-callouts');
  const term = document.getElementById('terminal');
  if (term) {
    term.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Global exports for inline HTML onclick handlers
window.copyMainCA = copyMainCA;
window.copyToClipboard = copyToClipboard;
window.openChartModal = openChartModal;
window.closeChartModal = closeChartModal;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.inspectTokenRadar = inspectTokenRadar;
window.resetCalloutFilters = resetCalloutFilters;
window.scrollToGame = scrollToGame;
window.scrollToSidebarRadar = scrollToSidebarRadar;
window.switchTab = switchTab;
window.jumpToCallouts = jumpToCallouts;



