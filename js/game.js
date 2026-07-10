// ===== game.js — core game loop, collisions, stage/score management =====

class Game {
  constructor(canvas, charKey) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bounds = { x0: 0, y0: 0, x1: canvas.width, y1: canvas.height };

    this.player = new Player(charKey, this.bounds);
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.boss = null;
    this.particles = [];

    this.score = 0;
    this.graze = 0;
    this.grazeCooldowns = new WeakMap();

    this.stageIndex = 0;
    this.stageTime = 0;
    this.waveQueue = [];
    this.bossSpawned = false;
    this.bossPending = false;
    this.bossDelay = 0;

    this.state = 'playing'; // playing | paused | over | victory
    this.shakeTime = 0;
    this.shakeMag = 0;

    this.onScoreChange = null;
    this.onLivesChange = null;
    this.onBossState = null;
    this.onStageChange = null;
    this.onGameEnd = null;
    this.onCardDeclare = null;
    this.onCardResult = null;
    this.onPowerChange = null;

    this.totalCards = STAGES.reduce((sum, s) => sum + s.boss(this.bounds).phases.filter(p => p.isCard).length, 0);
    this.capturedCards = 0;
    this.power = 1.0;
    this.maxPower = 4.0;

    this.loadStage(0);
  }

  registerCardResult(boss, result) {
    if (result === 'bonus') {
      this.addScore(boss.cardBonus);
      this.capturedCards++;
    }
    if (this.onCardResult) this.onCardResult(boss, result, this.capturedCards, this.totalCards);
  }

  addPower(n) {
    this.power = clamp(this.power + n, 0, this.maxPower);
    if (this.onPowerChange) this.onPowerChange(this.power, this.maxPower);
  }

  loadStage(i) {
    this.stageIndex = i;
    this.stageTime = 0;
    this.waveQueue = STAGES[i].waves(this.bounds).slice();
    this.bossSpawned = false;
    this.bossPending = false;
    this.boss = null;
    if (this.onStageChange) this.onStageChange(STAGES[i]);
  }

  clearEnemyBullets(scoreEach = 0) {
    if (scoreEach) this.addScore(this.enemyBullets.length * scoreEach * 10);
    this.enemyBullets.length = 0;
  }

  addScore(n) {
    this.score += n;
    if (this.onScoreChange) this.onScoreChange(this.score);
  }

  onBombUsed() {
    if (this.onLivesChange) this.onLivesChange(this.player.lives, this.player.bombs);
  }

  onPlayerHit() {
    if (this.onLivesChange) this.onLivesChange(this.player.lives, this.player.bombs);
    this.shakeTime = 0.35;
    this.shakeMag = 10;
    if (this.player.lives < 0) {
      this.state = 'over';
      if (this.onGameEnd) this.onGameEnd('over', this.score);
    }
  }

  spawnBurst(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const speed = rand(40, 160);
      this.particles.push({
        x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: rand(0.25, 0.5), age: 0, color,
      });
    }
  }

  update(dt) {
    if (this.state !== 'playing') return;

    this.stageTime += dt;
    this.player.update(dt, this);

    // spawn waves on schedule
    while (this.waveQueue.length && this.waveQueue[0].time <= this.stageTime) {
      this.waveQueue.shift().spawn(this);
    }

    // trigger boss after stage duration once enemies have thinned
    const stageDef = STAGES[this.stageIndex];
    if (!this.bossSpawned && !this.bossPending && this.stageTime >= stageDef.duration) {
      this.bossPending = true;
      this.bossDelay = 1.2;
    }
    if (this.bossPending) {
      this.bossDelay -= dt;
      if (this.bossDelay <= 0) {
        this.boss = stageDef.boss(this.bounds);
        this.bossSpawned = true;
        this.bossPending = false;
        if (this.onBossState) this.onBossState(this.boss);
      }
    }

    // update entities
    for (const e of this.enemies) e.update(dt, this);
    this.enemies = this.enemies.filter(e => !e.dead && e.y < this.bounds.y1 + 60);

    if (this.boss) {
      this.boss.update(dt, this);
      if (this.onBossState) this.onBossState(this.boss);
    }

    for (const b of this.playerBullets) b.update(dt, this.bounds);
    this.playerBullets = this.playerBullets.filter(b => !b.dead);

    for (const b of this.enemyBullets) b.update(dt, this.bounds, this.player);
    this.enemyBullets = this.enemyBullets.filter(b => !b.dead);

    for (const p of this.particles) {
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92;
    }
    this.particles = this.particles.filter(p => p.age < p.life);

    this.handleCollisions();

    if (this.shakeTime > 0) this.shakeTime -= dt;

    // victory check
    if (this.bossSpawned && this.boss && this.boss.dead) {
      if (this.stageIndex >= STAGES.length - 1) {
        this.state = 'victory';
        if (this.onGameEnd) this.onGameEnd('victory', this.score);
      } else {
        this.addScore(this.boss.score);
        this.clearEnemyBullets();
        this.loadStage(this.stageIndex + 1);
      }
    }
  }

  handleCollisions() {
    const p = this.player;

    // player bullets vs enemies
    for (const bullet of this.playerBullets) {
      if (bullet.dead) continue;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (circlesHit(bullet.x, bullet.y, bullet.radius, e.x, e.y, e.radius)) {
          e.hit(bullet.damage);
          bullet.dead = true;
          this.spawnBurst(bullet.x, bullet.y, e.color, 4);
          if (e.dead) {
            this.addScore(e.score);
            this.addPower(0.03);
            this.spawnBurst(e.x, e.y, e.color, 14);
          }
          break;
        }
      }
      if (bullet.dead) continue;
      if (this.boss && !this.boss.dead && !this.boss.entering) {
        if (circlesHit(bullet.x, bullet.y, bullet.radius, this.boss.x, this.boss.y, this.boss.radius)) {
          this.boss.hit(bullet.damage, this);
          bullet.dead = true;
          this.spawnBurst(bullet.x, bullet.y, this.boss.color, 3);
        }
      }
    }

    if (!p.alive) return;

    // enemy bullets vs player (hit + graze)
    for (const b of this.enemyBullets) {
      if (b.dead) continue;
      if (p.invincible <= 0 && circlesHit(b.x, b.y, b.radius * 0.6, p.x, p.y, p.hitboxRadius)) {
        b.dead = true;
        this.spawnBurst(p.x, p.y, '#ff4d6d', 16);
        if (this.boss && !this.boss.dead) this.boss.onPlayerDamaged();
        p.takeHit(this);
        continue;
      }
      if (!b.grazed && circlesHit(b.x, b.y, b.radius, p.x, p.y, p.grazeRadius)) {
        b.grazed = true;
        this.graze++;
        this.addScore(50);
      }
    }

    // body collision with enemies/boss (contact damage)
    if (p.invincible <= 0) {
      for (const e of this.enemies) {
        if (circlesHit(e.x, e.y, e.radius * 0.7, p.x, p.y, p.hitboxRadius)) {
          p.takeHit(this);
          break;
        }
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const { x1: W, y1: H } = this.bounds;
    ctx.save();

    if (this.shakeTime > 0) {
      const m = this.shakeMag * (this.shakeTime / 0.35);
      ctx.translate(rand(-m, m), rand(-m, m));
    }

    // background
    ctx.fillStyle = '#05040a';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    this.drawBackground();

    // particles (behind entities)
    for (const pt of this.particles) {
      ctx.globalAlpha = 1 - pt.age / pt.life;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.5, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const e of this.enemies) e.draw(ctx);
    if (this.boss) this.boss.draw(ctx, this);
    for (const b of this.enemyBullets) b.draw(ctx);
    for (const b of this.playerBullets) b.draw(ctx);
    this.player.draw(ctx);

    ctx.restore();
  }

  drawBackground() {
    const ctx = this.ctx;
    const { x1: W, y1: H } = this.bounds;
    if (!this._stars) {
      this._stars = Array.from({ length: 60 }, () => ({
        x: rand(0, W), y: rand(0, H), r: rand(0.5, 1.8), tw: rand(0, TAU),
      }));
    }
    for (const s of this._stars) {
      s.tw += 0.02;
      ctx.globalAlpha = 0.3 + Math.sin(s.tw) * 0.25;
      ctx.fillStyle = '#d4af6a';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
