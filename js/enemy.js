// ===== enemy.js — regular fairies/spirits =====

class Enemy {
  constructor(opts) {
    this.x = opts.x;
    this.y = opts.y;
    this.radius = opts.radius || 12;
    this.hp = opts.hp || 6;
    this.maxHp = this.hp;
    this.color = opts.color || '#b06bff';
    this.score = opts.score || 300;
    this.path = opts.path; // function(enemy, t) -> sets x,y
    this.shootPattern = opts.shootPattern; // function(enemy, game, t)
    this.shootInterval = opts.shootInterval || 1.0;
    this.shootTimer = opts.shootDelay ?? rand(0, 0.6);
    this.t = 0;
    this.dead = false;
    this.spawnFlash = 0.3;
    this.dropsPower = opts.dropsPower ?? false;
  }

  update(dt, game) {
    this.t += dt;
    if (this.path) this.path(this, this.t, dt);
    if (this.spawnFlash > 0) this.spawnFlash -= dt;

    if (this.shootPattern) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootPattern(this, game, this.t);
        this.shootTimer = this.shootInterval;
      }
    }
  }

  hit(dmg) {
    this.hp -= dmg;
    if (this.hp <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const flash = this.spawnFlash > 0;
    ctx.globalAlpha = flash ? 0.5 + Math.sin(this.t * 40) * 0.3 : 1;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.35, 0, TAU);
    ctx.fill();

    // wings
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha *= 0.6;
    const wf = Math.sin(this.t * 10) * 4;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.6, 0); ctx.lineTo(-this.radius * 1.6, -6 + wf);
    ctx.moveTo(this.radius * 0.6, 0); ctx.lineTo(this.radius * 1.6, -6 + wf);
    ctx.stroke();

    // hp sliver for tougher fairies
    if (this.maxHp > 8) {
      ctx.globalAlpha = 1;
      const w = this.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-w/2, this.radius + 5, w, 3);
      ctx.fillStyle = '#ff8aa0';
      ctx.fillRect(-w/2, this.radius + 5, w * (this.hp / this.maxHp), 3);
    }
    ctx.restore();
  }
}

// ---------- Movement path generators ----------
const Paths = {
  driftDown(vy = 60, sway = 0) {
    return (e, t) => {
      e.y += vy * (1/60);
      if (sway) e.x = e.baseX + Math.sin(t * 2) * sway;
    };
  },
  diveIn(entryX, entryY, targetY, speed) {
    return (e, t) => {
      if (e.y < targetY) {
        e.y += speed * (1/60);
      } else {
        e.x += (e.dir || 1) * 40 * (1/60);
      }
    };
  },
  sine(vy, amp, freq) {
    return (e, t) => {
      e.y += vy * (1/60);
      e.x = e.baseX + Math.sin(t * freq) * amp;
    };
  },
  hover(targetY, vy) {
    return (e, t) => {
      if (e.y < targetY) e.y += vy * (1/60);
    };
  },
};

// ---------- Shot pattern generators ----------
const EnemyShots = {
  aimedSingle(color = '#ff6a8a', speed = 200) {
    return (e, game) => {
      if (!game.player.alive) return;
      Patterns.aimed(game.enemyBullets, e.x, e.y, game.player.x, game.player.y, speed, color, { radius: 5 });
    };
  },
  aimedSpread(count = 3, spread = 0.5, color = '#ff6a8a', speed = 200) {
    return (e, game) => {
      if (!game.player.alive) return;
      const a = angleTo(e.x, e.y, game.player.x, game.player.y);
      Patterns.spread(game.enemyBullets, e.x, e.y, a, count, spread, speed, color, { radius: 5 });
    };
  },
  ring(count = 10, color = '#b06bff', speed = 130) {
    return (e, game) => {
      Patterns.ring(game.enemyBullets, e.x, e.y, count, speed, color, { radius: 5 });
    };
  },
};
