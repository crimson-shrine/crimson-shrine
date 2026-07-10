// ===== utils.js — shared helpers =====

const TAU = Math.PI * 2;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function dist(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// simple circle-circle collision
function circlesHit(x1, y1, r1, x2, y2, r2) {
  const rr = r1 + r2;
  const dx = x2 - x1, dy = y2 - y1;
  return (dx * dx + dy * dy) <= rr * rr;
}

function formatScore(n) {
  return Math.floor(n).toString().padStart(7, '0');
}

// returns true the frame `phaseT` crosses a multiple of `interval` (offset optional)
function tick(phaseT, dt, interval, offset = 0) {
  return Math.floor((phaseT - offset) / interval) > Math.floor((phaseT - offset - dt) / interval);
}
