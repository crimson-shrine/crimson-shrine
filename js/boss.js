// ===== boss.js — multi-phase stage bosses =====

class Boss {
  constructor(opts) {
    this.name = opts.name;
    this.x = opts.x;
    this.y = opts.y;
    this.targetY = opts.y;
    this.startY = opts.startY ?? -60;
    this.radius = opts.radius || 20;
    this.color = opts.color || '#ff4d6d';
    this.phases = opts.phases; // array of {hp, name, pattern(boss, game, t, dt)}
    this.phaseIndex = 0;
    this.hp = this.phases[0].hp;
    this.maxHp = this.hp;
    this.t = 0;
    this.phaseT = 0;
    this.dead = false;
    this.entering = true;
    this.moveTimer = 0;
    this.moveTargetX = this.x;
    this.score = opts.score || 5000;
    this.flashTimer = 0;

    // spellcard capture tracking
    this.cardBonus = opts.phases[0].bonus || 30000;
    this.cardTookHit = false;
    this.cardTimeLeft = opts.phases[0].timeLimit || 30;
    this.cardDeclared = true;
    this.cardResult = null; // 'bonus' | 'failed' | null (mid-card)
    this.postCardDelay = 0; // brief pause + bullet clear after a card resolves
    this.history = { captured: 0, total: this.phases.length };
  }

  get currentPhase() { return this.phases[this.phaseIndex]; }

  update(dt, game) {
    this.t += dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;

    if (this.entering) {
      this.y = lerp(this.y, this.targetY, dt * 2.2);
      if (Math.abs(this.y - this.targetY) < 2) {
        this.y = this.targetY;
        this.entering = false;
        if (this.currentPhase.isCard && game.onCardDeclare) game.onCardDeclare(this);
      }
      return;
    }

    this.phaseT += dt;

    // gentle horizontal drift movement between phases
    this.moveTimer -= dt;
    if (this.moveTimer <= 0) {
      this.moveTargetX = rand(game.bounds.x0 + 70, game.bounds.x1 - 70);
      this.moveTimer = rand(2.5, 4.5);
    }
    this.x = lerp(this.x, this.moveTargetX, dt * 0.8);

    // card already resolved this phase -> pause patterns, count down to next phase
    if (this.cardResult) {
      this.postCardDelay -= dt;
      if (this.postCardDelay <= 0) this.advancePhase(game);
      return;
    }

    if (this.currentPhase.pattern) {
      this.currentPhase.pattern(this, game, this.t, dt, this.phaseT);
    }

    // spellcard timeout -> counts as a capture (survived the clock)
    if (this.currentPhase.isCard && this.cardTimeLeft > 0) {
      this.cardTimeLeft -= dt;
      if (this.cardTimeLeft <= 0) {
        this.cardTimeLeft = 0;
        this.resolveCard(game, true);
      }
    }
  }

  resolveCard(game, timedOut) {
    if (this.cardResult) return; // already resolved this phase
    const captured = timedOut || this.hp <= 0;
    this.cardResult = (!this.cardTookHit && captured) ? 'bonus' : 'failed';
    this.postCardDelay = 1.1;
    if (this.cardResult === 'bonus') this.history.captured++;
    if (game) game.clearEnemyBullets(0);
    if (game && game.registerCardResult) game.registerCardResult(this, this.cardResult);
  }

  advancePhase(game) {
    if (this.phaseIndex < this.phases.length - 1) {
      this.phaseIndex++;
      this.phaseT = 0;
      this.hp = this.currentPhase.hp;
      this.maxHp = this.hp;
      this.cardTookHit = false;
      this.cardTimeLeft = this.currentPhase.timeLimit || 30;
      this.cardResult = null;
      this.cardBonus = this.currentPhase.bonus || 30000;
      if (this.currentPhase.isCard && game && game.onCardDeclare) game.onCardDeclare(this);
    } else {
      this.dead = true;
    }
  }

  hit(dmg, game) {
    if (this.entering || this.cardResult) return; // card already resolved — ignore stray hits until phase advances
    this.hp -= dmg;
    this.flashTimer = 0.06;
    if (this.hp <= 0) {
      if (this.currentPhase.isCard) {
        this.resolveCard(game, false); // schedules advancePhase via update()'s postCardDelay
      } else {
        this.advancePhase(game);
      }
    }
  }

  onPlayerGraze() { /* graze doesn't break a card */ }

  onPlayerDamaged() {
    // taking a hit during a spellcard phase forfeits the bonus
    if (this.currentPhase && this.currentPhase.isCard) this.cardTookHit = true;
  }

  draw(ctx, game) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.flashTimer > 0 ? 0.5 : 1;

    // outer aura
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 26;
    ctx.arc(0, 0, this.radius, 0, TAU);
    ctx.fill();

    // inner body
    ctx.fillStyle = '#1a1424';
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 0.9);
    ctx.lineTo(this.radius * 0.75, this.radius * 0.7);
    ctx.lineTo(-this.radius * 0.75, this.radius * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // rotating halo rings
    ctx.rotate(this.t * 1.2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 10, 0, TAU);
    ctx.stroke();

    ctx.restore();
  }
}
