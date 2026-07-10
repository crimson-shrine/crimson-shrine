// ===== main.js — screen flow, menu navigation, game loop =====

const screens = {
  title: document.getElementById('screen-title'),
  howto: document.getElementById('screen-howto'),
  charselect: document.getElementById('screen-charselect'),
  game: document.getElementById('screen-game'),
  pause: document.getElementById('screen-pause'),
  gameover: document.getElementById('screen-gameover'),
  victory: document.getElementById('screen-victory'),
};

let currentScreen = 'title';
let selectedChar = 'reimu';
let game = null;
let canvas = document.getElementById('canvas');
let lastTime = 0;
let rafId = null;

const HIGH_SCORE_KEY = 'crimson-shrine-highscore';
function getHighScore() { return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10); }
function setHighScore(v) { localStorage.setItem(HIGH_SCORE_KEY, String(v)); }

function showScreen(name) {
  for (const key in screens) screens[key].classList.add('hidden');
  screens[name].classList.remove('hidden');
  currentScreen = name;
}

// ---------- generic keyboard-navigable menu ----------
function wireMenu(container, { onSelect, wrap = true, horizontal = false } = {}) {
  const items = Array.from(container.querySelectorAll('[data-action], [data-char]'));
  let idx = items.findIndex(i => i.classList.contains('is-active'));
  if (idx < 0) idx = 0;

  function refresh() {
    items.forEach((it, i) => it.classList.toggle('is-active', i === idx));
  }
  refresh();

  items.forEach((it, i) => {
    it.addEventListener('click', () => { idx = i; refresh(); onSelect(it); });
  });

  return {
    handleInput() {
      const prevKey = horizontal ? Input.menuLeft() : Input.menuUp();
      const nextKey = horizontal ? Input.menuRight() : Input.menuDown();
      if (prevKey) { idx = wrap ? (idx - 1 + items.length) % items.length : Math.max(0, idx - 1); refresh(); }
      if (nextKey) { idx = wrap ? (idx + 1) % items.length : Math.min(items.length - 1, idx + 1); refresh(); }
      if (Input.confirm()) onSelect(items[idx]);
    },
  };
}

const titleMenu = wireMenu(document.getElementById('title-menu'), {
  onSelect(item) {
    const action = item.dataset.action;
    if (action === 'start') showScreen('charselect');
    if (action === 'howto') showScreen('howto');
  },
});

const howtoMenu = wireMenu(document.getElementById('screen-howto'), {
  onSelect(item) {
    if (item.dataset.action === 'back-title') showScreen('title');
  },
});

const charGrid = document.getElementById('char-grid');
const charMenuItems = document.getElementById('screen-charselect').querySelectorAll('.menu-list [data-action]');
const charSelectMenu = wireMenu(document.getElementById('screen-charselect'), {
  onSelect(item) {
    if (item.dataset.char) {
      selectedChar = item.dataset.char;
      document.querySelectorAll('.char-card').forEach(c => c.classList.toggle('is-active', c === item));
    } else if (item.dataset.action === 'launch') {
      startGame(selectedChar);
    } else if (item.dataset.action === 'back-title') {
      showScreen('title');
    }
  },
});

const pauseMenu = wireMenu(document.getElementById('screen-pause'), {
  onSelect(item) {
    if (item.dataset.action === 'resume') resumeGame();
    if (item.dataset.action === 'quit') quitToTitle();
  },
});

const gameoverMenu = wireMenu(document.getElementById('screen-gameover'), {
  onSelect(item) {
    if (item.dataset.action === 'retry') startGame(selectedChar);
    if (item.dataset.action === 'quit') quitToTitle();
  },
});

const victoryMenu = wireMenu(document.getElementById('screen-victory'), {
  onSelect(item) {
    if (item.dataset.action === 'retry') startGame(selectedChar);
    if (item.dataset.action === 'quit') quitToTitle();
  },
});

// ---------- HUD ----------
function renderHearts(el, count, glyph = '♥') {
  el.innerHTML = '';
  for (let i = 0; i < Math.max(count, 0); i++) {
    const s = document.createElement('span');
    s.textContent = glyph;
    el.appendChild(s);
  }
}

function renderStars(el, captured, total) {
  el.innerHTML = '';
  const shown = Math.min(total, 12); // cap visual row length
  for (let i = 0; i < shown; i++) {
    const s = document.createElement('span');
    s.textContent = '★';
    s.className = i < captured ? 'filled' : 'empty';
    el.appendChild(s);
  }
}

let cardResultTimeout = null;

function setupHud(g) {
  document.getElementById('hud-stage').textContent = STAGES[g.stageIndex].label;
  document.getElementById('hud-highscore').textContent = formatScore(getHighScore());
  document.getElementById('hud-boss').classList.add('hidden');
  document.getElementById('card-banner').classList.add('hidden');
  document.getElementById('card-timer').classList.add('hidden');
  document.getElementById('card-result').classList.add('hidden');
  renderStars(document.getElementById('hud-cards'), 0, g.totalCards);
  document.getElementById('hud-cards-count').textContent = `0/${g.totalCards}`;

  g.onScoreChange = (score) => {
    document.getElementById('hud-score').textContent = formatScore(score);
  };
  g.onLivesChange = (lives, bombs) => {
    renderHearts(document.getElementById('hud-lives'), lives + 1, '♥');
    renderHearts(document.getElementById('hud-bombs'), bombs, '✦');
  };
  g.onPowerChange = (power, maxPower) => {
    document.getElementById('hud-power').textContent = `${power.toFixed(2)}/${maxPower.toFixed(2)}`;
    document.getElementById('hud-power-fill').style.width = `${clamp((power / maxPower) * 100, 0, 100)}%`;
  };
  g.onStageChange = (stageDef) => {
    document.getElementById('hud-stage').textContent = stageDef.label;
    document.getElementById('hud-boss').classList.add('hidden');
    document.getElementById('card-timer').classList.add('hidden');
  };
  g.onBossState = (boss) => {
    const hudBoss = document.getElementById('hud-boss');
    hudBoss.classList.remove('hidden');
    document.getElementById('hud-boss-name').textContent = boss.name;
    document.getElementById('hud-boss-fill').style.width = `${clamp((boss.hp / boss.maxHp) * 100, 0, 100)}%`;

    const phase = boss.currentPhase;
    const timerEl = document.getElementById('card-timer');
    if (phase.isCard && !boss.entering && !boss.cardResult) {
      timerEl.classList.remove('hidden');
      document.getElementById('card-timer-value').textContent = boss.cardTimeLeft.toFixed(2);
      document.getElementById('card-status').textContent = boss.cardTookHit ? 'Failed' : 'Active';
      document.getElementById('card-history').textContent =
        `${boss.history.captured.toString().padStart(2, '0')}/${boss.phases.filter(p => p.isCard).length.toString().padStart(2, '0')}`;
    } else {
      timerEl.classList.add('hidden');
    }
  };
  g.onCardDeclare = (boss) => {
    const phase = boss.currentPhase;
    document.getElementById('card-banner-label').textContent = phase.cardLabel || 'Sign';
    document.getElementById('card-banner-title').textContent = `"${phase.name}"`;
    const banner = document.getElementById('card-banner');
    banner.classList.remove('hidden');
    banner.style.animation = 'none';
    void banner.offsetWidth; // restart animation
    banner.style.animation = '';
    clearTimeout(cardResultTimeout);
    cardResultTimeout = setTimeout(() => banner.classList.add('hidden'), 2400);
  };
  g.onCardResult = (boss, result, captured, total) => {
    const resultEl = document.getElementById('card-result');
    resultEl.textContent = result === 'bonus' ? 'SPELLCARD CAPTURED' : 'SPELLCARD FAILED';
    resultEl.classList.toggle('failed', result !== 'bonus');
    resultEl.classList.remove('hidden');
    resultEl.style.animation = 'none';
    void resultEl.offsetWidth;
    resultEl.style.animation = '';
    setTimeout(() => resultEl.classList.add('hidden'), 1400);
    renderStars(document.getElementById('hud-cards'), captured, total);
    document.getElementById('hud-cards-count').textContent = `${captured}/${total}`;
  };
  g.onGameEnd = (result, score) => {
    const hs = getHighScore();
    if (score > hs) setHighScore(score);
    document.getElementById('hud-highscore').textContent = formatScore(getHighScore());
    setTimeout(() => {
      if (result === 'over') {
        document.getElementById('gameover-score').textContent = `Final Score: ${formatScore(score)}`;
        showScreen('gameover');
      } else {
        document.getElementById('victory-score').textContent = `Final Score: ${formatScore(score)}`;
        showScreen('victory');
      }
      stopLoop();
    }, 1400);
  };

  renderHearts(document.getElementById('hud-lives'), g.player.lives + 1, '♥');
  renderHearts(document.getElementById('hud-bombs'), g.player.bombs, '✦');
  g.onPowerChange(g.power, g.maxPower);
}

// ---------- game lifecycle ----------
function startGame(charKey) {
  game = new Game(canvas, charKey);
  setupHud(game);
  showScreen('game');
  lastTime = performance.now();
  startLoop();
}

function pauseGame() {
  if (!game || game.state !== 'playing') return;
  game.state = 'paused';
  screens.pause.classList.remove('hidden');
}

function resumeGame() {
  if (!game) return;
  game.state = 'playing';
  screens.pause.classList.add('hidden');
  lastTime = performance.now();
}

function quitToTitle() {
  stopLoop();
  game = null;
  showScreen('title');
}

function stopLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
}

function startLoop() {
  stopLoop();
  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;

    if (currentScreen === 'game' && game) {
      if (game.state === 'playing') {
        game.update(dt);
      }
      game.draw();
    }

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

// ---------- master input loop (menus + pause toggle) ----------
function inputTick() {
  switch (currentScreen) {
    case 'title': titleMenu.handleInput(); break;
    case 'howto': howtoMenu.handleInput(); break;
    case 'charselect': charSelectMenu.handleInput(); break;
    case 'pause': pauseMenu.handleInput(); break;
    case 'gameover': gameoverMenu.handleInput(); break;
    case 'victory': victoryMenu.handleInput(); break;
    case 'game':
      if (Input.pause() && game && game.state === 'playing') pauseGame();
      else if (Input.pause() && game && game.state === 'paused') resumeGame();
      break;
  }
  Input.endFrame();
  requestAnimationFrame(inputTick);
}

Input.init();
document.getElementById('hud-highscore') && (document.getElementById('hud-highscore').textContent = formatScore(getHighScore()));
showScreen('title');
requestAnimationFrame(inputTick);
