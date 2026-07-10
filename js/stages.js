// ===== stages.js — wave scripts & boss spellcards for 3 stages =====
// bounds are injected by Game at runtime (playfield rect)

function makeFairy(bounds, x, y, opts = {}) {
  const e = new Enemy(Object.assign({
    x, y, radius: 11, hp: 5, color: '#c084fc', score: 250,
  }, opts));
  e.baseX = x;
  return e;
}

// ---------------- STAGE 1 ----------------
function stage1Waves(bounds) {
  const w = bounds.x1 - bounds.x0, x0 = bounds.x0;
  const waves = [];

  // wave: drifting line of fairies, aimed shots
  waves.push({ time: 1.0, spawn: (game) => {
    for (let i = 0; i < 5; i++) {
      const e = makeFairy(bounds, x0 + w * (i + 1) / 6, -20 - i * 30, {
        hp: 4, color: '#ff9ecb', score: 200,
        path: Paths.driftDown(70),
        shootPattern: EnemyShots.aimedSingle('#ff8aa8', 170),
        shootInterval: 1.4,
      });
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 5.0, spawn: (game) => {
    for (let i = 0; i < 4; i++) {
      const e = makeFairy(bounds, x0 + 40 + i * 20, -30, {
        hp: 6, color: '#c084fc', score: 300,
        path: Paths.sine(90, 60, 2),
        shootPattern: EnemyShots.aimedSpread(3, 0.5, '#c9a0ff', 160),
        shootInterval: 1.1,
      });
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 10.0, spawn: (game) => {
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const e = makeFairy(bounds, side < 0 ? x0 + 20 : x0 + w - 20, 60 + Math.floor(i/2) * 70, {
        hp: 5, color: '#ff9ecb', score: 250, dir: side,
        path: Paths.diveIn(0,0, 200, 140),
        shootPattern: EnemyShots.aimedSingle('#ff8aa8', 190),
        shootInterval: 1.0,
      });
      e.x = side < 0 ? x0 + 20 : x0 + w - 20;
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 15.0, spawn: (game) => {
    for (let i = 0; i < 5; i++) {
      const e = makeFairy(bounds, x0 + w * (i + 1) / 6, -20, {
        hp: 8, color: '#b06bff', score: 350,
        path: Paths.sine(70, 50, 1.6),
        shootPattern: EnemyShots.ring(8, '#b06bff', 100),
        shootInterval: 1.6,
      });
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 20.0, spawn: (game) => {
    for (let i = 0; i < 8; i++) {
      const e = makeFairy(bounds, x0 + w * ((i % 4) + 1) / 5, -20 - Math.floor(i/4) * 40, {
        hp: 4, color: '#ff9ecb', score: 200,
        path: Paths.driftDown(100),
        shootPattern: EnemyShots.aimedSingle('#ff8aa8', 200),
        shootInterval: 0.9,
      });
      game.enemies.push(e);
    }
  }});

  return waves;
}

function stage1Boss(bounds) {
  const cx = (bounds.x0 + bounds.x1) / 2;
  return new Boss({
    name: 'Hazel the Petal Wraith',
    x: cx, y: -60, targetY: bounds.y0 + 120,
    radius: 20, color: '#ff5470', score: 6000,
    phases: [
      {
        hp: 90, name: 'Falling Blossoms', cardLabel: 'Petal Sign',
        isCard: true, bonus: 20000, timeLimit: 28,
        pattern(boss, game, t, dt, pt) {
          if (tick(pt, dt, 0.9)) {
            Patterns.ring(game.enemyBullets, boss.x, boss.y, 14, 130, '#ff9ecb', { radius: 5, shape: 'shard' }, t * 0.5);
          }
          if (tick(pt, dt, 0.35)) {
            Patterns.aimed(game.enemyBullets, boss.x, boss.y, game.player.x, game.player.y, 220, '#ffd0dc', { radius: 4 });
          }
        },
      },
      {
        hp: 130, name: 'Spiral of Regret', cardLabel: 'Wraith Sign',
        isCard: true, bonus: 30000, timeLimit: 32,
        pattern(boss, game, t, dt, pt) {
          if (tick(pt, dt, 0.08)) {
            Patterns.spiral(game.enemyBullets, boss.x, boss.y, 150, '#ff5470', { radius: 4, angVel: 3.4, angle: t * 6 });
            Patterns.spiral(game.enemyBullets, boss.x, boss.y, 150, '#ff5470', { radius: 4, angVel: 3.4, angle: t * 6 + Math.PI });
          }
          if (tick(pt, dt, 1.6)) {
            Patterns.spread(game.enemyBullets, boss.x, boss.y, Math.PI/2, 7, 1.4, 180, '#ffd0dc', { radius: 5 });
          }
        },
      },
    ],
  });
}

// ---------------- STAGE 2 ----------------
function stage2Waves(bounds) {
  const w = bounds.x1 - bounds.x0, x0 = bounds.x0;
  const waves = [];

  waves.push({ time: 1.0, spawn: (game) => {
    for (let i = 0; i < 6; i++) {
      const e = makeFairy(bounds, x0 + w * (i + 1) / 7, -20, {
        hp: 7, color: '#ffd76a', score: 300,
        path: Paths.sine(100, 50, 2.2),
        shootPattern: EnemyShots.aimedSpread(2, 0.3, '#ffe08a', 200),
        shootInterval: 0.9,
      });
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 5.0, spawn: (game) => {
    for (let i = 0; i < 4; i++) {
      const e = makeFairy(bounds, x0 + w/2 + (i - 1.5) * 50, -30 - i*20, {
        hp: 10, color: '#ff7a5c', score: 400,
        path: Paths.hover(160, 90),
        shootPattern: EnemyShots.ring(12, '#ff8a5c', 120),
        shootInterval: 1.3,
      });
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 10.0, spawn: (game) => {
    for (let i = 0; i < 10; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const e = makeFairy(bounds, side < 0 ? x0 + 20 : x0 + w - 20, 40 + Math.floor(i/2) * 60, {
        hp: 6, color: '#ffd76a', score: 300, dir: side,
        path: Paths.diveIn(0,0,180,170),
        shootPattern: EnemyShots.aimedSingle('#ffe08a', 220),
        shootInterval: 0.8,
      });
      e.x = side < 0 ? x0 + 20 : x0 + w - 20;
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 15.0, spawn: (game) => {
    for (let i = 0; i < 6; i++) {
      const e = makeFairy(bounds, x0 + w * (i+1)/7, -20 - i*25, {
        hp: 9, color: '#ff7a5c', score: 380,
        path: Paths.sine(80, 70, 1.8),
        shootPattern: EnemyShots.aimedSpread(4, 0.7, '#ffb08a', 170),
        shootInterval: 1.0,
      });
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 20.0, spawn: (game) => {
    for (let i = 0; i < 9; i++) {
      const e = makeFairy(bounds, x0 + w * ((i%3)+1)/4, -20 - Math.floor(i/3)*35, {
        hp: 6, color: '#ffd76a', score: 320,
        path: Paths.driftDown(110),
        shootPattern: EnemyShots.ring(6, '#ffe08a', 140),
        shootInterval: 1.2,
      });
      game.enemies.push(e);
    }
  }});

  return waves;
}

function stage2Boss(bounds) {
  const cx = (bounds.x0 + bounds.x1) / 2;
  return new Boss({
    name: 'Kuroe, Ash Priestess',
    x: cx, y: -60, targetY: bounds.y0 + 120,
    radius: 22, color: '#ffb347', score: 9000,
    phases: [
      {
        hp: 150, name: 'Ember Curtain', cardLabel: 'Ash Sign',
        isCard: true, bonus: 25000, timeLimit: 30,
        pattern(boss, game, t, dt, pt) {
          if (tick(pt, dt, 0.5)) {
            const a = angleTo(boss.x, boss.y, game.player.x, game.player.y);
            Patterns.spread(game.enemyBullets, boss.x, boss.y, a, 5, 0.9, 210, '#ffb347', { radius: 5, shape: 'shard' });
          }
          if (tick(pt, dt, 1.4)) {
            Patterns.ring(game.enemyBullets, boss.x, boss.y, 20, 110, '#ff7a5c', { radius: 4 }, t);
          }
        },
      },
      {
        hp: 190, name: 'Cinder Vortex', cardLabel: 'Cinder Sign',
        isCard: true, bonus: 35000, timeLimit: 34,
        pattern(boss, game, t, dt, pt) {
          if (tick(pt, dt, 0.06)) {
            Patterns.spiral(game.enemyBullets, boss.x, boss.y, 170, '#ffb347', { radius: 4, angVel: 4.2, angle: t * 8 });
          }
          if (tick(pt, dt, 0.06)) {
            Patterns.spiral(game.enemyBullets, boss.x, boss.y, 170, '#ff7a5c', { radius: 4, angVel: -4.2, angle: -t * 8 });
          }
          if (tick(pt, dt, 2.0)) {
            const a = angleTo(boss.x, boss.y, game.player.x, game.player.y);
            Patterns.spread(game.enemyBullets, boss.x, boss.y, a, 9, 1.6, 200, '#fff0c0', { radius: 5 });
          }
        },
      },
    ],
  });
}

// ---------------- STAGE 3 (final) ----------------
function stage3Waves(bounds) {
  const w = bounds.x1 - bounds.x0, x0 = bounds.x0;
  const waves = [];

  waves.push({ time: 1.0, spawn: (game) => {
    for (let i = 0; i < 8; i++) {
      const e = makeFairy(bounds, x0 + w * ((i%4)+1)/5, -20 - Math.floor(i/4)*30, {
        hp: 8, color: '#b06bff', score: 350,
        path: Paths.sine(110, 55, 2.4),
        shootPattern: EnemyShots.aimedSpread(3, 0.5, '#d0a0ff', 220),
        shootInterval: 0.8,
      });
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 6.0, spawn: (game) => {
    for (let i = 0; i < 6; i++) {
      const e = makeFairy(bounds, x0 + w/2 + (i-2.5)*45, -30, {
        hp: 12, color: '#6bd0ff', score: 450,
        path: Paths.hover(150, 100),
        shootPattern: EnemyShots.ring(14, '#6bd0ff', 130),
        shootInterval: 1.1,
      });
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 11.0, spawn: (game) => {
    for (let i = 0; i < 12; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const e = makeFairy(bounds, side < 0 ? x0+20 : x0+w-20, 30 + Math.floor(i/2)*55, {
        hp: 7, color: '#b06bff', score: 350, dir: side,
        path: Paths.diveIn(0,0,190,190),
        shootPattern: EnemyShots.aimedSingle('#d0a0ff', 240),
        shootInterval: 0.7,
      });
      e.x = side < 0 ? x0+20 : x0+w-20;
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 16.0, spawn: (game) => {
    for (let i = 0; i < 8; i++) {
      const e = makeFairy(bounds, x0 + w*(i+1)/9, -20 - i*20, {
        hp: 11, color: '#6bd0ff', score: 420,
        path: Paths.sine(90, 65, 2.0),
        shootPattern: EnemyShots.aimedSpread(5, 1.0, '#a0e0ff', 190),
        shootInterval: 1.0,
      });
      game.enemies.push(e);
    }
  }});

  waves.push({ time: 21.0, spawn: (game) => {
    for (let i = 0; i < 10; i++) {
      const e = makeFairy(bounds, x0 + w * ((i%5)+1)/6, -20 - Math.floor(i/5)*30, {
        hp: 8, color: '#b06bff', score: 380,
        path: Paths.driftDown(130),
        shootPattern: EnemyShots.ring(8, '#d0a0ff', 160),
        shootInterval: 0.9,
      });
      game.enemies.push(e);
    }
  }});

  return waves;
}

function stage3Boss(bounds) {
  const cx = (bounds.x0 + bounds.x1) / 2;
  return new Boss({
    name: 'Yozora, Empress of the Long Night',
    x: cx, y: -60, targetY: bounds.y0 + 130,
    radius: 24, color: '#8a5cff', score: 15000,
    phases: [
      {
        hp: 180, name: 'Starfall Requiem', cardLabel: 'Night Sign',
        isCard: true, bonus: 30000, timeLimit: 30,
        pattern(boss, game, t, dt, pt) {
          if (tick(pt, dt, 0.5)) {
            Patterns.ring(game.enemyBullets, boss.x, boss.y, 16, 140, '#8a5cff', { radius: 5, shape: 'star' }, t*0.7);
          }
          if (tick(pt, dt, 0.3)) {
            const a = angleTo(boss.x, boss.y, game.player.x, game.player.y);
            Patterns.spread(game.enemyBullets, boss.x, boss.y, a, 3, 0.4, 260, '#c0a0ff', { radius: 4 });
          }
        },
      },
      {
        hp: 220, name: 'Eclipse Veil', cardLabel: 'Eclipse Sign',
        isCard: true, bonus: 40000, timeLimit: 33,
        pattern(boss, game, t, dt, pt) {
          if (tick(pt, dt, 0.05)) {
            Patterns.spiral(game.enemyBullets, boss.x, boss.y, 180, '#6bd0ff', { radius: 4, angVel: 3.8, angle: t*7 });
            Patterns.spiral(game.enemyBullets, boss.x, boss.y, 180, '#8a5cff', { radius: 4, angVel: -3.8, angle: -t*7 });
          }
          if (tick(pt, dt, 1.8)) {
            Patterns.ring(game.enemyBullets, boss.x, boss.y, 24, 120, '#c0a0ff', { radius: 5 }, t);
          }
        },
      },
      {
        hp: 260, name: 'The Long Night Falls', cardLabel: 'Empress Sign',
        isCard: true, bonus: 50000, timeLimit: 36,
        pattern(boss, game, t, dt, pt) {
          if (tick(pt, dt, 0.04)) {
            Patterns.spiral(game.enemyBullets, boss.x, boss.y, 200, '#8a5cff', { radius: 4, angVel: 5.2, angle: t*10 });
          }
          if (tick(pt, dt, 0.9)) {
            const a = angleTo(boss.x, boss.y, game.player.x, game.player.y);
            Patterns.spread(game.enemyBullets, boss.x, boss.y, a, 11, 2.0, 210, '#ffffff', { radius: 5 });
          }
          if (tick(pt, dt, 2.5)) {
            Patterns.ring(game.enemyBullets, boss.x, boss.y, 30, 150, '#6bd0ff', { radius: 4, shape: 'star' }, t*0.4);
          }
        },
      },
    ],
  });
}

const STAGES = [
  { name: 'Stage I — Mountain Path', label: 'I', waves: stage1Waves, boss: stage1Boss, duration: 25 },
  { name: 'Stage II — Cinder Approach', label: 'II', waves: stage2Waves, boss: stage2Boss, duration: 25 },
  { name: 'Stage III — Shrine of the Long Night', label: 'III', waves: stage3Waves, boss: stage3Boss, duration: 26 },
];
