// The game: a claw machine whose prizes are the wax blobs in a giant lava
// lamp. No drawing here; both looks (draw-real.js, draw-flat.js) draw this
// one state, so they always show the same game.
//
// Everything is in world units: the machine's inside is 360 wide and 520
// tall, y going down.

export const WORLD = { w: 360, h: 520 };
// The rail the claw's carriage runs along, across the top.
export const RAIL_Y = 28;
// The prize chute, in the front left corner.
export const CHUTE = { x0: 0, x1: 72, top: 330 };
// The lava tank: the claw comes in through its open top.
export const TANK = { x0: 86, x1: 350, top: 122, floor: 506 };
// Where the claw waits and drops its prize, over the chute.
const HOME_X = 36;
const CARRIAGE = { min: 30, max: 330, speed: 165, accel: 520, brake: 640 };
const CABLE = { rest: 52, air: 150, lava: 62, up: 120 };
const GRAVITY = 900;
// The claw's mouth: how far its middle is below the end of the cable, and
// how wide it is open.
export const MOUTH = { drop: 30, half: 24 };
const MAX_GRIP = 27; // wider blobs than this slip right out

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let nextId = 1;
function blob(x, y, r, temp = rand(0.2, 0.8)) {
  return { id: nextId++, x, y, vx: 0, vy: 0, r, temp, phase: rand(0, 6.28), held: false, falling: false, close: 0 };
}

export function newGame() {
  const blobs = [];
  for (let i = 0; i < 7; i++) {
    blobs.push(blob(rand(TANK.x0 + 30, TANK.x1 - 30), rand(TANK.top + 60, TANK.floor - 30), rand(14, 24)));
  }
  return {
    time: 0,
    blobs,
    carriage: { x: HOME_X, v: 0, a: 0 },
    // The claw hangs from the carriage on a cable, swinging like a pendulum.
    claw: { len: CABLE.rest, angle: 0, spin: 0, grip: 1 },
    // aim, drop, close, rise, return, release
    phase: "aim",
    timer: 0,
    held: null,
    caught: 0,
    events: [], // sounds and moments for the page: "drop", "clank", "grab", "slip", "plop", "win"
    spawnIn: 0,
  };
}

// Where the end of the cable is, and the middle of the claw's mouth.
export function clawPoint(s) {
  const { len, angle } = s.claw;
  const x = s.carriage.x + Math.sin(angle) * len;
  const y = RAIL_Y + Math.cos(angle) * len;
  return { x, y, mx: x + Math.sin(angle) * MOUTH.drop, my: y + Math.cos(angle) * MOUTH.drop };
}

const inLava = (x, y) => x > TANK.x0 && x < TANK.x1 && y > TANK.top;

// input: { dir: -1 | 0 | 1, drop: boolean (pressed this frame) }
export function step(s, dt, input) {
  s.time += dt;
  s.timer += dt;
  s.events.length = 0;

  // ---- The carriage ----
  let want = 0;
  if (s.phase === "aim") want = input.dir;
  if (s.phase === "return") {
    const dx = HOME_X - s.carriage.x;
    want = Math.abs(dx) < 3 ? 0 : Math.sign(dx);
    if (Math.abs(dx) < 3 && Math.abs(s.carriage.v) < 12) {
      s.carriage.x = HOME_X;
      s.carriage.v = 0;
    }
  }
  const c = s.carriage;
  const before = c.v;
  if (want) {
    const target = want * CARRIAGE.speed * (s.phase === "return" ? 0.8 : 1);
    c.v += clamp(target - c.v, -CARRIAGE.accel * dt, CARRIAGE.accel * dt);
  } else {
    c.v -= clamp(c.v, -CARRIAGE.brake * dt, CARRIAGE.brake * dt);
  }
  c.x += c.v * dt;
  if (c.x < CARRIAGE.min || c.x > CARRIAGE.max) {
    c.x = clamp(c.x, CARRIAGE.min, CARRIAGE.max);
    c.v = 0;
  }
  c.a = (c.v - before) / Math.max(dt, 1e-4);

  // ---- The claw swings: a pendulum hanging from a moving carriage ----
  const claw = s.claw;
  const p = clawPoint(s);
  const wet = inLava(p.x, p.y + 10);
  const damp = wet ? 5 : 0.55;
  claw.spin += (-(GRAVITY / claw.len) * Math.sin(claw.angle) - (c.a / claw.len) * Math.cos(claw.angle) - damp * claw.spin) * dt;
  claw.angle = clamp(claw.angle + claw.spin * dt, -0.9, 0.9);
  // Its prongs can't swing through the tank's walls.
  if (wet) {
    const after = clawPoint(s);
    if (after.x < TANK.x0 + 26 || after.x > TANK.x1 - 26) {
      claw.angle -= claw.spin * dt;
      claw.spin *= -0.3;
    }
  }

  // ---- The game ----
  if (s.phase === "aim") {
    claw.grip = Math.min(1, claw.grip + dt * 3);
    if (input.drop) {
      s.phase = "drop";
      s.timer = 0;
      s.events.push("drop");
    }
  } else if (s.phase === "drop") {
    claw.len += (wet ? CABLE.lava : CABLE.air) * dt;
    const m = clawPoint(s);
    // It stops on a blob in its mouth, or at the bottom.
    const touching = s.blobs.find(
      (b) => !b.held && Math.abs(b.x - m.mx) < MOUTH.half && m.my > b.y - b.r * 0.35 && m.my < b.y + b.r,
    );
    if (touching || m.my > TANK.floor - 8 || (!inLava(m.x, m.y) && m.my > WORLD.h - 30)) {
      s.phase = "close";
      s.timer = 0;
    }
  } else if (s.phase === "close") {
    claw.grip = Math.max(0, claw.grip - dt / 0.45);
    if (claw.grip === 0) {
      s.events.push("clank");
      const m = clawPoint(s);
      let best = null;
      for (const b of s.blobs) {
        if (b.held) continue;
        const dx = Math.abs(b.x - m.mx);
        const dy = Math.abs(b.y - m.my);
        if (dx < MOUTH.half + 4 && dy < b.r + 12 && (!best || dx < Math.abs(best.x - m.mx))) best = b;
      }
      if (best) {
        // Centered and small: a sure thing. Off center or big: maybe.
        const dx = Math.abs(best.x - m.mx);
        const chance = clamp(1.15 - dx / 22 - Math.max(0, best.r - 19) / 9, 0, 0.95);
        if (best.r <= MAX_GRIP && Math.random() < chance) {
          best.held = true;
          s.held = best;
          s.events.push("grab");
        }
      }
      s.phase = "rise";
      s.timer = 0;
    }
  } else if (s.phase === "rise") {
    claw.len = Math.max(CABLE.rest, claw.len - CABLE.up * dt);
    // A hard swing can shake it loose.
    if (s.held && Math.random() < Math.max(0, Math.abs(claw.spin) - 1.4) * 0.9 * dt) letGo(s, "slip");
    if (claw.len === CABLE.rest) {
      s.phase = "return";
      s.timer = 0;
    }
  } else if (s.phase === "return") {
    if (s.held && Math.random() < Math.max(0, Math.abs(claw.spin) - 1.6) * 0.7 * dt) letGo(s, "slip");
    if (c.x === HOME_X && Math.abs(claw.angle) < 0.12) {
      s.phase = "release";
      s.timer = 0;
    }
  } else if (s.phase === "release") {
    claw.grip = Math.min(1, claw.grip + dt / 0.3);
    if (s.held && claw.grip > 0.4) letGo(s, null);
    if (claw.grip === 1 && s.timer > 0.5) {
      s.phase = "aim";
      s.timer = 0;
    }
  }

  // The held blob rides in the claw's mouth.
  if (s.held) {
    const m = clawPoint(s);
    const b = s.held;
    b.x = m.mx;
    b.y = m.my + 2;
    b.vx = 0;
    b.vy = 0;
  }

  stepLava(s, dt);
}

function letGo(s, why) {
  const b = s.held;
  b.held = false;
  b.falling = true;
  b.vy = 0;
  s.held = null;
  if (why) s.events.push(why);
}

// ---- The lava lamp ----

function stepLava(s, dt) {
  const { blobs } = s;
  const height = TANK.floor - TANK.top;
  for (const b of blobs) {
    if (b.held) continue;
    const wet = inLava(b.x, b.y);
    if (!wet) {
      // Dropped: falling through the air, into the chute or back into the tank.
      b.vy += GRAVITY * dt;
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      if (b.x < CHUTE.x1 && b.y > WORLD.h - 30) {
        b.won = true;
        s.caught += 1;
        s.events.push("plop", "win");
      } else if (b.y > WORLD.h + 40) {
        // Missed everything: it melts back into the lamp.
        b.won = true;
      }
      continue;
    }
    if (b.falling) {
      b.falling = false;
      b.vy *= 0.25;
    }
    // Warmed by the bulb at the bottom it rises; cooled at the top it sinks.
    const depth = (b.y - TANK.top) / height; // 0 top, 1 bottom
    if (depth > 0.9) b.temp += dt * 0.32;
    else b.temp -= dt * (0.03 + 0.09 * (1 - depth));
    b.temp = clamp(b.temp, 0, 1);
    const lift = (0.5 - b.temp) * 95;
    b.vy += lift * dt;
    b.vx += Math.sin(s.time * 0.35 + b.phase) * 6 * dt;
    b.vy *= Math.exp(-1.6 * dt);
    b.vx *= Math.exp(-1.1 * dt);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    // Kept inside the glass, settling into the lump at the bottom.
    const x0 = TANK.x0 + b.r * 0.8;
    const x1 = TANK.x1 - b.r * 0.8;
    if (b.x < x0 || b.x > x1) {
      b.x = clamp(b.x, x0, x1);
      b.vx *= -0.3;
    }
    const y0 = TANK.top + b.r * 0.9;
    const y1 = TANK.floor - b.r * 0.55;
    if (b.y < y0 || b.y > y1) {
      b.y = clamp(b.y, y0, y1);
      b.vy *= -0.2;
    }
  }

  // Won blobs leave the lamp; it makes more from the lump, after a moment.
  for (let i = blobs.length - 1; i >= 0; i--) if (blobs[i].won) blobs.splice(i, 1);
  const free = blobs.filter((b) => !b.held);
  if (blobs.length < 7) {
    s.spawnIn -= dt;
    if (s.spawnIn <= 0) {
      blobs.push(blob(rand(TANK.x0 + 40, TANK.x1 - 40), TANK.floor - 10, rand(13, 19), 0.75));
      s.spawnIn = 3;
    }
  } else {
    s.spawnIn = 3;
  }

  // Blobs that sit together long enough melt into one; a big hot one rising
  // fast can pull apart into two.
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      const a = free[i];
      const b = free[j];
      if (a.won || b.won || a.falling || b.falling) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 0.01;
      const touch = a.r + b.r;
      if (d < touch * 0.8) {
        // Wax is soft: they lean apart gently, but they can meet.
        const push = ((touch * 0.8 - d) / d) * 1.4 * dt;
        a.vx += (a.x - b.x) * push;
        a.vy += (a.y - b.y) * push;
        b.vx -= (a.x - b.x) * push;
        b.vy -= (a.y - b.y) * push;
      }
      const key = `${Math.min(a.id, b.id)}:${Math.max(a.id, b.id)}`;
      if (d < Math.max(a.r, b.r) * 0.75) {
        s.close = s.close || {};
        s.close[key] = (s.close[key] || 0) + dt;
        const r = Math.hypot(a.r, b.r);
        if (s.close[key] > 1.2 && r < 30) {
          const t = a.r * a.r + b.r * b.r;
          a.x = (a.x * a.r * a.r + b.x * b.r * b.r) / t;
          a.y = (a.y * a.r * a.r + b.y * b.r * b.r) / t;
          a.vx = (a.vx + b.vx) / 2;
          a.vy = (a.vy + b.vy) / 2;
          a.temp = (a.temp + b.temp) / 2;
          a.r = r;
          b.won = false;
          blobs.splice(blobs.indexOf(b), 1);
          free.splice(j, 1);
          delete s.close[key];
          j--;
        }
      } else if (s.close?.[key]) {
        delete s.close[key];
      }
    }
  }
  for (const b of free) {
    if (b.r > 21 && b.temp > 0.68 && b.vy < -22 && blobs.length < 10 && Math.random() < 0.12 * dt) {
      const r = b.r / Math.SQRT2;
      const twin = blob(b.x + r * 0.7, b.y + r * 0.5, r, b.temp - 0.15);
      twin.vy = b.vy * 0.5;
      b.r = r;
      b.x -= r * 0.7;
      blobs.push(twin);
    }
  }
}
