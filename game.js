(function () {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  const scoreEl = document.getElementById('scoreDisplay');
  const highScoreEl = document.getElementById('highScoreDisplay');
  const pumpEl = document.getElementById('pumpDisplay');
  const overlay = document.getElementById('gameOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const startBtn = document.getElementById('startGame');
  const restartBtn = document.getElementById('restartGame');
  const deathMsgEl = document.getElementById('deathMessage');

  let GROUND_Y = 220;
  let LOGIC_W = 800;
  let LOGIC_H = 280;
  const GRAVITY = 0.65;
  const JUMP_FORCE = -13;
  const BASE_SPEED = 4.1;
  const MAX_SPEED = 5.6;
  let renderScale = 1;

  const ENGLISH_DEATH_MESSAGES = [
    'Human interaction inevitable. Game Over.',
    'Caught by a small-talk enthusiast. Unfortunate.',
    'You touched a human. Escape failed.',
    'Social battery fully depleted. Game Over.',
  ];

  function getDeathMessages() {
    return ENGLISH_DEATH_MESSAGES;
  }

  let flowerImg = new Image();
  let flowerImgReady = false;
  flowerImg.onload = () => { flowerImgReady = true; };
  flowerImg.onerror = () => { flowerImgReady = false; console.warn('flower img failed, using fallback circle'); };
  flowerImg.src = 'assets/flower.png';

  let state = 'idle';
  let frame = 0;
  let score = 0;
  let pump = 0;
  function getStoredScore() {
    try {
      return localStorage.getItem('misanthropic_high') || localStorage.getItem('misanthrope_high') || '0';
    } catch { return '0'; }
  }
  let highScore = parseInt(getStoredScore(), 10);
  let speed = BASE_SPEED;
  let shakeTimer = 0;

  let autoMode = false;
  let autoLoops = 0;

  const player = {
    x: 120,
    y: GROUND_Y,
    w: 52,
    h: 52,
    vy: 0,
    grounded: true,
    rotation: 0
  };
  let obstacles = [], collectibles = [], clouds = [], tears = [];
  let keys = {}; // for A/D left/right movement

  highScoreEl.textContent = highScore;

  function resetGame() {
    score = 0; pump = 0; speed = BASE_SPEED; frame = 0;
    player.x = 120;
    player.y = GROUND_Y; player.vy = 0; player.grounded = true; player.rotation = 0;
    obstacles = []; collectibles = []; tears = [];
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = score;
    pumpEl.textContent = pump;
    highScoreEl.textContent = highScore;
  }

  function startGame() {
    resetGame();
    state = 'playing';
    overlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
  }

  function restartGame() {
    // Full reset including AUTO mode on manual restart
    if (autoMode) setAutoMode(false);
    startGame();
  }

  function endGame() {
    if (autoMode) {
      // Skip death entirely. Keep score & pump growing. Clear threats only. Infinite run.
      autoLoops++;
      // clear only dangerous stuff, preserve imminent collectibles so we don't lose stars
      obstacles = [];
      const keepDist = 140;
      collectibles = collectibles.filter((c) => !c.collected && (c.x - player.x) < keepDist);
      tears = [];
      // reposition player safely on ground
      player.x = 130;
      player.y = GROUND_Y;
      player.vy = 0;
      player.grounded = true;
      player.rotation = 0;
      // keep state playing, hide any overlays just in case
      state = 'playing';
      overlay.classList.add('hidden');
      if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
      updateHUD();
      return;
    }
    // normal (manual) death
    state = 'dead';
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('misanthropic_high', String(highScore));
    }
    const msgs = getDeathMessages();
    if (deathMsgEl) deathMsgEl.textContent = msgs[Math.floor(Math.random() * msgs.length)];
    const finalScoreEl = document.getElementById('finalScore');
    const finalPumpEl = document.getElementById('finalPump');
    if (finalScoreEl) finalScoreEl.textContent = score;
    if (finalPumpEl) finalPumpEl.textContent = pump;
    if (gameOverOverlay) gameOverOverlay.classList.remove('hidden');
    shakeTimer = 20;
    updateHUD();
  }

  function jump() {
    if (state !== 'playing' || !player.grounded) return;
    player.vy = JUMP_FORCE;
    player.grounded = false;
    tears.push({ x: player.x + 20, y: player.y + 10, vy: -1, life: 30 });
  }

  function spawnObstacle() {
    const types = [
      { emoji: '🧑‍🤝‍🧑', w: 48, h: 48 }, { emoji: '👨‍👩‍👧‍👦', w: 56, h: 48 },
      { emoji: '🗣️', w: 40, h: 40 }, { emoji: '📢', w: 44, h: 44 },
      { emoji: '🤝', w: 42, h: 42 }, { emoji: '💼', w: 40, h: 44 },
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push({ x: LOGIC_W + 20, y: GROUND_Y + 52 - type.h, w: type.w, h: type.h, emoji: type.emoji });
  }

  function spawnCollectible() {
    const heights = [GROUND_Y - 30, GROUND_Y - 80, GROUND_Y - 130];
    collectibles.push({ x: LOGIC_W + 20, y: heights[Math.floor(Math.random() * heights.length)], w: 28, h: 28, collected: false, spin: Math.random() * Math.PI * 2 });
  }

  function initClouds() {
    clouds = Array.from({ length: 4 }, (_, i) => ({
      x: (LOGIC_W / 6) * i, y: 40 + Math.random() * 80, w: 80 + Math.random() * 60, speed: 0.3 + Math.random() * 0.5,
    }));
  }

  function rectsOverlap(a, b) {
    const pad = 8;
    return a.x + pad < b.x + b.w - pad && a.x + a.w - pad > b.x + pad && a.y + pad < b.y + b.h - pad && a.y + a.h - pad > b.y + pad;
  }

  function update() {
    if (state !== 'playing') return;
    frame++;
    // Start at 1.0x and accelerate slowly so the run feels smooth instead of frantic.
    speed = Math.min(BASE_SPEED + Math.floor(score / 520) * 0.12, MAX_SPEED);
    if (frame % 60 === 0) score++;

    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= GROUND_Y) { player.y = GROUND_Y; player.vy = 0; player.grounded = true; }
    player.rotation = player.grounded ? Math.sin(frame * 0.08) * 0.08 : player.vy * 0.02;

    // A/D (and arrows) horizontal movement - now playable with ASD / arrow keys
    const hSpeed = 4.8;
    if (keys['KeyA'] || keys['ArrowLeft']) player.x -= hSpeed;
    if (keys['KeyD'] || keys['ArrowRight']) player.x += hSpeed;
    player.x = Math.max(35, Math.min(LOGIC_W - 65, player.x));

    // AUTO MODE: smooth dodge + reliable star collection.
    if (autoMode && state === 'playing') {
      if (player.grounded) {
        const lookAhead = 170 + speed * 3.2;
        for (let i = 0; i < obstacles.length; i++) {
          const o = obstacles[i];
          const dist = o.x - player.x;
          if (dist > 10 && dist < lookAhead && o.y + o.h >= GROUND_Y - 12) {
            jump();
            break;
          }
        }

        const starLook = 215 + speed * 4;
        for (let i = 0; i < collectibles.length; i++) {
          const c = collectibles[i];
          if (c.collected) continue;
          const dx = c.x - (player.x + 22);
          if (dx > 14 && dx < starLook) {
            const starHeight = GROUND_Y - c.y;
            const isHigh = starHeight > 70;
            const framesToPeak = isHigh ? 19.5 : 17;
            const jumpLead = framesToPeak * speed * (isHigh ? 0.96 : 0.9);
            if (dx < jumpLead + (isHigh ? 26 : 10)) {
              jump();
              break;
            }
          }
        }
      }

      // Strong steering so AUTO stays lined up with the next star even while airborne.
      let targetStar = null;
      let bestD = 9999;
      for (let i = 0; i < collectibles.length; i++) {
        const c = collectibles[i];
        if (c.collected) continue;
        const d = Math.abs(c.x - (player.x + 26));
        if (d < bestD && c.x > player.x - 55) {
          bestD = d;
          targetStar = c;
        }
      }
      if (targetStar && bestD < 360) {
        const steerSpeed = player.grounded ? 5.4 : 4.6;
        const targetX = targetStar.x - 20;
        if (targetX < player.x - 4) player.x -= steerSpeed;
        else if (targetX > player.x + 4) player.x += steerSpeed;
      }
    }

    if (frame % Math.max(74 - Math.floor(score / 140), 44) === 0) spawnObstacle();
    if (frame % Math.max(88 - Math.floor(score / 120), 52) === 0) spawnCollectible();

    obstacles.forEach((o) => { o.x -= speed; });
    collectibles.forEach((c) => { c.x -= speed; c.spin += 0.08; });
    clouds.forEach((c) => { c.x -= c.speed; if (c.x + c.w < 0) c.x = LOGIC_W + 20; });
    tears.forEach((t) => { t.y += t.vy; t.life--; });
    tears = tears.filter((t) => t.life > 0);

    const pb = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (const o of obstacles) if (rectsOverlap(pb, o)) { endGame(); return; }
    for (const c of collectibles) {
      if (!c.collected && rectsOverlap(pb, c)) {
        c.collected = true; pump++; score += 25;
        for (let i = 0; i < 3; i++) tears.push({ x: c.x, y: c.y, vy: -1, life: 24 });
      } else if (autoMode && !c.collected) {
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const cx = c.x + c.w / 2;
        const cy = c.y + c.h / 2;
        if (Math.abs(cx - px) < 36 && Math.abs(cy - py) < 48) {
          c.collected = true; pump++; score += 25;
          for (let i = 0; i < 2; i++) tears.push({ x: c.x, y: c.y, vy: -0.8, life: 20 });
        }
      }
    }
    obstacles = obstacles.filter((o) => o.x + o.w > -20);
    collectibles = collectibles.filter((c) => c.x + c.w > -20 && !c.collected);
    updateHUD();
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, LOGIC_H);
    grad.addColorStop(0, '#070709');
    grad.addColorStop(0.5, '#0e0e13');
    grad.addColorStop(1, '#16161f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGIC_W, LOGIC_H);

    clouds.forEach((c) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 2, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    const roadY = GROUND_Y + 50;
    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, roadY, LOGIC_W, LOGIC_H - roadY);

    ctx.strokeStyle = '#ff5500';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, roadY);
    ctx.lineTo(LOGIC_W, roadY);
    ctx.stroke();

    for (let i = 0; i < LOGIC_W; i += 48) {
      ctx.fillStyle = 'rgba(255, 85, 0, 0.4)';
      ctx.fillRect(i - ((frame * speed * 0.5) % 48), roadY + 8, 22, 3);
    }
  }

  function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    ctx.rotate(player.rotation);
    if (flowerImgReady) {
      ctx.beginPath(); ctx.arc(0, 0, player.w / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(flowerImg, -player.w / 2, -player.h / 2, player.w, player.h);
    } else {
      // Fallback: draw a simple flower emoji circle so character is always visible
      ctx.fillStyle = '#c96f4a';
      ctx.beginPath(); ctx.arc(0, 0, player.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌸', 0, 0);
    }
    ctx.restore();

    if (frame % 30 < 15) {
      ctx.fillStyle = '#4ecdc4';
      ctx.beginPath(); ctx.ellipse(player.x + 34, player.y + 22, 4, 6, 0.3, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawObstacles() {
    ctx.font = '36px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    obstacles.forEach((o) => ctx.fillText(o.emoji, o.x + o.w / 2, o.y + o.h / 2));
  }

  function drawCollectibles() {
    collectibles.forEach((c) => {
      if (c.collected) return;
      ctx.save(); ctx.translate(c.x + c.w / 2, c.y + c.h / 2); ctx.rotate(c.spin);
      ctx.fillStyle = '#fff8f3'; ctx.shadowColor = '#c96f4a'; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(4, -4); ctx.lineTo(12, -4); ctx.lineTo(6, 2);
      ctx.lineTo(8, 12); ctx.lineTo(0, 7); ctx.lineTo(-8, 12); ctx.lineTo(-6, 2);
      ctx.lineTo(-12, -4); ctx.lineTo(-4, -4); ctx.closePath(); ctx.fill();
      ctx.restore();
    });
  }

  function drawTears() {
    tears.forEach((t) => {
      ctx.globalAlpha = t.life / 30; ctx.fillStyle = '#4ecdc4';
      ctx.beginPath(); ctx.ellipse(t.x, t.y, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    if (state !== 'playing') return;
    const isMax = speed >= MAX_SPEED - 0.05;
    ctx.fillStyle = isMax ? '#4ecdc4' : 'rgba(255,248,243,0.7)';
    ctx.font = '600 14px Space Grotesk, sans-serif';
    ctx.textAlign = 'left';
    const speedStr = `${(speed / BASE_SPEED).toFixed(1)}x`;
    ctx.fillText('SPEED: ' + speedStr, 16, 28);
  }

  function draw() {
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    ctx.save();
    if (shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      shakeTimer--;
    }
    drawBackground(); drawCollectibles(); drawObstacles(); drawTears(); drawPlayer(); drawHUD();
    ctx.restore();
  }

  function loop() { update(); draw(); requestAnimationFrame(loop); }

  function handleResize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth > 50 ? parent.clientWidth : 800;
    const h = parent.clientHeight > 50 ? parent.clientHeight : 280;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    LOGIC_W = w;
    LOGIC_H = h;
    GROUND_Y = h - 68;
    if (player.grounded) {
      player.y = GROUND_Y;
    }

    const nextWidth = Math.round(w * dpr);
    const nextHeight = Math.round(h * dpr);
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }

    renderScale = dpr;
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  // Auto-resize on window, container or tab change
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  window.handleGameResize = handleResize;

  if (window.ResizeObserver) {
    const parent = canvas.parentElement;
    if (parent) {
      const ro = new ResizeObserver(() => {
        if (parent.clientWidth > 50) handleResize();
      });
      ro.observe(parent);
    }
  }

  // === AUTO INFINITE MODE (perfect star collector — catches every star, infinite run, no deaths) ===
  function setAutoMode(on) {
    autoMode = !!on;
    if (autoMode) {
      // force into play immediately, bypass start overlay and death overlay
      if (state !== 'playing') {
        resetGame();
        state = 'playing';
        overlay.classList.add('hidden');
        if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
      }
      autoLoops = autoLoops || 0;
    }
    updateHUD();
    if (autoBtnEl) {
      autoBtnEl.textContent = 'AUTO';
      autoBtnEl.classList.toggle('is-active', autoMode);
      autoBtnEl.setAttribute('aria-pressed', autoMode ? 'true' : 'false');
    }
  }

  let autoBtnEl = null;
  let headerToolsEl = null;

  function getHeaderTools() {
    if (headerToolsEl && document.body.contains(headerToolsEl)) return headerToolsEl;
    const header = document.querySelector('#game .game-header');
    if (!header) return null;
    headerToolsEl = header.querySelector('.game-header-tools');
    if (!headerToolsEl) {
      headerToolsEl = document.createElement('div');
      headerToolsEl.className = 'game-header-tools';
      header.appendChild(headerToolsEl);
    }
    return headerToolsEl;
  }

  function createAutoButton() {
    const tools = getHeaderTools();
    if (!tools) return null;
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost game-mode-btn';
    btn.textContent = 'AUTO';
    btn.title = 'Autopilot runs cleanly, avoids humans, and collects stars.';
    btn.addEventListener('click', () => {
      setAutoMode(!autoMode);
    });
    tools.appendChild(btn);
    return btn;
  }

  // URL param support: ?auto (opens site + game runs in perfect AUTO mode catching every star forever)
  function checkUrlAuto() {
    try {
      const params = new URLSearchParams(location.search);
      if (params.has('auto')) {
        // delay a little so canvas/DOM ready
        setTimeout(() => setAutoMode(true), 420);
      }
    } catch (_) {}
  }

  startBtn?.addEventListener('click', startGame);
  restartBtn?.addEventListener('click', restartGame);

  // Mouse + touch jump
  canvas.addEventListener('click', () => { if (state === 'playing') jump(); });
  canvas.addEventListener('touchstart', (e) => {
    if (state === 'playing') {
      e.preventDefault();
      jump();
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (state === 'playing') {
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW')) {
        e.preventDefault();
        jump();
      }
    }
  });
  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Mobile on-screen controls (touchstart/touchend for held movement)
  const mobileControls = document.getElementById('gameMobileControls');
  const touchKeys = { left: false, right: false };

  function applyTouchKeys() {
    keys['KeyA'] = touchKeys.left;
    keys['ArrowLeft'] = touchKeys.left;
    keys['KeyD'] = touchKeys.right;
    keys['ArrowRight'] = touchKeys.right;
  }

  mobileControls?.querySelectorAll('.game-touch-btn').forEach((btn) => {
    const action = btn.dataset.action;
    const start = (e) => {
      e.preventDefault();
      if (action === 'jump') {
        if (state === 'playing') jump();
      } else if (action === 'left') {
        touchKeys.left = true;
        applyTouchKeys();
      } else if (action === 'right') {
        touchKeys.right = true;
        applyTouchKeys();
      }
      btn.classList.add('active');
    };
    const end = (e) => {
      e.preventDefault();
      if (action === 'left') touchKeys.left = false;
      if (action === 'right') touchKeys.right = false;
      applyTouchKeys();
      btn.classList.remove('active');
    };
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('touchcancel', end, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', end);
  });

  // Wire inline action buttons in HTML
  const inlineAutoBtn = document.getElementById('autoPlayBtn');
  if (inlineAutoBtn) {
    inlineAutoBtn.addEventListener('click', () => {
      setAutoMode(!autoMode);
      inlineAutoBtn.classList.toggle('active', autoMode);
      inlineAutoBtn.textContent = autoMode ? '✓ AUTO ACTIVE (Collecting All Stars)' : '∞ AUTO (Infinite Star Collector)';
    });
  }

  const shareScoreBtn = document.getElementById('shareScoreBtn');
  if (shareScoreBtn) {
    shareScoreBtn.addEventListener('click', () => {
      const text = `I scored ${score} avoiding humans on $MISANTHROPIC Runner! 🌸 Run on @getmisanthropic: https://getmisanthropic.xyz`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    });
  }

  // create the auto button + support direct ?auto launch
  autoBtnEl = createAutoButton();
  checkUrlAuto();

  initClouds(); handleResize(); loop();
})();
