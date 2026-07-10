// ===== bullet.js — player & enemy projectiles =====

class Bullet {
  constructor(x, y, vx, vy, radius, color, opts = {}) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.dead = false;
    this.age = 0;
    this.spin = opts.spin || 0;
    this.rotation = 0;
    this.shape = opts.shape || 'circle'; // circle | shard | orb | star
    this.grazed = false; // for enemy bullets, whether already counted for graze
    this.homing = opts.homing || 0; // homing strength for player bullets
    this.damage = opts.damage || 1;
    this.accel = opts.accel || null; // function(bullet, dt) for custom motion (spirals etc)
  }

  update(dt, bounds, target) {
    this.age += dt;
    this.rotation += this.spin * dt;

    if (this.accel) {
      this.accel(this, dt, target);
    } else if (this.homing && target) {
      const desired = angleTo(this.x, this.y, target.x, target.y);
      const curr = Math.atan2(this.vy, this.vx);
      let diff = desired - curr;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      const turn = clamp(diff, -this.homing * dt, this.homing * dt);
      const speed = Math.hypot(this.vx, this.vy);
      const newAngle = curr + turn;
      this.vx = Math.cos(newAngle) * speed;
      this.vy = Math.sin(newAngle) * speed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < bounds.x0 - 40 || this.x > bounds.x1 + 40 ||
        this.y < bounds.y0 - 40 || this.y > bounds.y1 + 40) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;

    if (this.shape === 'shard') {
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 1.6);
      ctx.lineTo(this.radius, this.radius);
      ctx.lineTo(-this.radius, this.radius);
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i / 5) * TAU - Math.PI / 2;
        const a2 = ((i + 0.5) / 5) * TAU - Math.PI / 2;
        ctx.lineTo(Math.cos(a1) * this.radius * 1.5, Math.sin(a1) * this.radius * 1.5);
        ctx.lineTo(Math.cos(a2) * this.radius * 0.6, Math.sin(a2) * this.radius * 0.6);
      }
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'orb') {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.4, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ---------- Enemy bullet pattern helpers ----------
// Each function pushes new Bullet instances into `arr`

const Patterns = {
  aimed(arr, x, y, targetX, targetY, speed, color, opts = {}) {
    const a = angleTo(x, y, targetX, targetY);
    arr.push(new Bullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, opts.radius || 4, color, opts));
  },

  spread(arr, x, y, baseAngle, count, spreadAngle, speed, color, opts = {}) {
    const start = baseAngle - spreadAngle / 2;
    for (let i = 0; i < count; i++) {
      const a = count === 1 ? baseAngle : start + (spreadAngle * i) / (count - 1);
      arr.push(new Bullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, opts.radius || 4, color, opts));
    }
  },

  ring(arr, x, y, count, speed, color, opts = {}, phase = 0) {
    for (let i = 0; i < count; i++) {
      const a = (TAU * i) / count + phase;
      arr.push(new Bullet(x, y, Math.cos(a) * speed, Math.sin(a) * speed, opts.radius || 4, color, opts));
    }
  },

  spiral(arr, x, y, speed, color, opts = {}) {
    // returns a bullet with accel function creating spiral motion
    const b = new Bullet(x, y, 0, 0, opts.radius || 4, color, opts);
    const angVel = opts.angVel || 2.4;
    let angle = opts.angle || rand(0, TAU);
    b.accel = (bullet, dt) => {
      angle += angVel * dt;
      bullet.vx = Math.cos(angle) * speed;
      bullet.vy = Math.sin(angle) * speed;
    };
    arr.push(b);
    return b;
  },
};
