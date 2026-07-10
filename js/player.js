// ===== player.js — playable characters =====

const CHARACTERS = {
  reimu: {
    name: 'Reimu',
    color: '#ff5470',
    coreColor: '#ffffff',
    moveSpeed: 260,
    focusSpeed: 120,
    hitboxRadius: 3,
    grazeRadius: 16,
    fireDelay: 0.09,
    fire(game, player, t) {
      const bullets = game.playerBullets;
      const spread = player.focused ? 0.10 : 0.34;
      Patterns.spread(bullets, player.x - 10, player.y - 18, -Math.PI / 2, 3, spread, 620,
        '#ffb0c0', { radius: 4, shape: 'orb', homing: player.focused ? 0 : 3.2, damage: 1 });
      Patterns.spread(bullets, player.x + 10, player.y - 18, -Math.PI / 2, 3, spread, 620,
        '#ffb0c0', { radius: 4, shape: 'orb', homing: player.focused ? 0 : 3.2, damage: 1 });
    },
    bomb(game, player) {
      // radial nova of homing amulets + temporary clear
      game.clearEnemyBullets(0.4);
      for (let i = 0; i < 28; i++) {
        const a = (TAU * i) / 28;
        game.playerBullets.push(new Bullet(
          player.x, player.y, Math.cos(a) * 420, Math.sin(a) * 420, 6, '#ff8aa0',
          { shape: 'star', homing: 5, damage: 3, spin: 4 }
        ));
      }
      player.invincible = Math.max(player.invincible, 2.2);
    },
  },

  marisa: {
    name: 'Marisa',
    color: '#ffd76a',
    coreColor: '#ffffff',
    moveSpeed: 280,
    focusSpeed: 110,
    hitboxRadius: 3,
    grazeRadius: 16,
    fireDelay: 0.05,
    fire(game, player, t) {
      const bullets = game.playerBullets;
      const dx = player.focused ? 0 : Math.sin(t * 14) * 10;
      bullets.push(new Bullet(player.x - 14 + dx, player.y - 16, 0, -760, 3.5, '#fff3b0',
        { shape: 'shard', damage: 2 }));
      bullets.push(new Bullet(player.x + 14 + dx, player.y - 16, 0, -760, 3.5, '#fff3b0',
        { shape: 'shard', damage: 2 }));
      if (player.focused) {
        bullets.push(new Bullet(player.x, player.y - 20, 0, -900, 3, '#ffe08a',
          { shape: 'shard', damage: 3 }));
      }
    },
    bomb(game, player) {
      game.clearEnemyBullets(0.4);
      // one giant piercing laser column
      game.playerBullets.push(new Bullet(player.x, player.y - 40, 0, -1100, 26, 'rgba(255,220,120,0.85)',
        { shape: 'circle', damage: 40 }));
      for (let i = -2; i <= 2; i++) {
        game.playerBullets.push(new Bullet(player.x + i * 14, player.y - 30, 0, -1000, 8, '#fff3b0',
          { shape: 'shard', damage: 10 }));
      }
      player.invincible = Math.max(player.invincible, 2.0);
    },
  },
};

class Player {
  constructor(charKey, bounds) {
    this.def = CHARACTERS[charKey];
    this.charKey = charKey;
    this.bounds = bounds;
    this.x = (bounds.x0 + bounds.x1) / 2;
    this.y = bounds.y1 - 70;
    this.focused = false;
    this.lives = 3;
    this.bombs = 3;
    this.invincible = 3.0; // spawn grace
    this.fireTimer = 0;
    this.t = 0;
    this.alive = true;
    this.respawnTimer = 0;
    this.blink = 0;
  }

  get hitboxRadius() { return this.def.hitboxRadius; }
  get grazeRadius() { return this.def.grazeRadius; }

  update(dt, game) {
    this.t += dt;
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0 && this.lives >= 0) {
        this.alive = true;
        this.x = (this.bounds.x0 + this.bounds.x1) / 2;
        this.y = this.bounds.y1 - 70;
        this.invincible = 2.5;
      }
      return;
    }

    this.focused = Input.focus();
    const speed = this.focused ? this.def.focusSpeed : this.def.moveSpeed;
    let dx = 0, dy = 0;
    if (Input.left()) dx -= 1;
    if (Input.right()) dx += 1;
    if (Input.up()) dy -= 1;
    if (Input.down()) dy += 1;
    if (dx !== 0 && dy !== 0) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    this.x = clamp(this.x + dx * speed * dt, this.bounds.x0 + 8, this.bounds.x1 - 8);
    this.y = clamp(this.y + dy * speed * dt, this.bounds.y0 + 8, this.bounds.y1 - 8);

    if (Input.shoot()) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.def.fire(game, this, this.t);
        this.fireTimer = this.def.fireDelay;
      }
    }

    if (Input.bomb() && this.bombs > 0) {
      this.bombs--;
      this.def.bomb(game, this);
      game.onBombUsed();
    }

    if (this.invincible > 0) this.invincible -= dt;
    this.blink += dt;
  }

  takeHit(game) {
    if (this.invincible > 0 || !this.alive) return false;
    this.alive = false;
    this.lives--;
    this.respawnTimer = 1.2;
    game.onPlayerHit();
    return true;
  }

  draw(ctx) {
    if (!this.alive) return;
    const flashing = this.invincible > 0 && Math.floor(this.blink * 14) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = flashing ? 0.4 : 1;
    ctx.translate(this.x, this.y);

    // pulsing outer aura ring
    const pulse = 1 + Math.sin(this.t * 5) * 0.12;
    ctx.strokeStyle = this.def.color;
    ctx.globalAlpha *= 0.5;
    ctx.lineWidth = 1;
    ctx.shadowColor = this.def.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 15 * pulse, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = flashing ? 0.4 : 1;

    // trailing ribbons (sway with movement)
    const sway = Math.sin(this.t * 6) * 5;
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.globalAlpha *= 0.75;
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.quadraticCurveTo(-10 + sway * 0.4, 18, -7 + sway, 26);
    ctx.moveTo(6, 8);
    ctx.quadraticCurveTo(10 - sway * 0.4, 18, 7 - sway, 26);
    ctx.stroke();
    ctx.globalAlpha = flashing ? 0.4 : 1;

    // aura core glow
    ctx.beginPath();
    ctx.fillStyle = this.def.color;
    ctx.shadowColor = this.def.color;
    ctx.shadowBlur = 14;
    ctx.globalAlpha *= 0.9;
    ctx.arc(0, 0, 9, 0, TAU);
    ctx.fill();

    // body silhouette (miko/witch robe)
    ctx.globalAlpha = flashing ? 0.4 : 1;
    ctx.fillStyle = '#1a1424';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(10, 6);
    ctx.lineTo(9, 13);
    ctx.lineTo(-9, 13);
    ctx.lineTo(-10, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.def.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // hair ornament / bow accent
    ctx.fillStyle = this.def.color;
    ctx.beginPath();
    ctx.moveTo(-5, -13); ctx.lineTo(-1, -16); ctx.lineTo(-1, -11); ctx.closePath();
    ctx.moveTo(5, -13); ctx.lineTo(1, -16); ctx.lineTo(1, -11); ctx.closePath();
    ctx.fill();

    // hitbox core visible when focused
    if (this.focused) {
      ctx.beginPath();
      ctx.fillStyle = this.def.coreColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fff';
      ctx.arc(0, 0, this.hitboxRadius, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, this.grazeRadius, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}
