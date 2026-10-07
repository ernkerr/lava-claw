// The machine, drawn flat and straight on like the About room, but lit: a
// neon sign and chasing bulbs up top, and inside, in the dark, a lava lamp
// glowing amber, its wax in flat clumps. The lamp borrows the room's: a
// tapered glass globe, a chrome cap and collar, a cone for a foot.

import { WORLD, RAIL_Y, CHUTE, TANK, clawPoint } from "./game.js";
import { FRAME, IN, prongAngle, roundRect } from "./layout.js";
import { waxPath } from "./field.js";

const C = {
  body: "#e8b2b4",
  bodyDark: "#d69a9d",
  ink: "#4a3527",
  cream: "#fff3d2",
  black: "#1e1d1b",
  night: "#2c2433",
  chrome: "#c9ced3",
  chromeLight: "#f0f3f5",
  chromeDark: "#878e95",
  liquid: "#eef4a6",
  liquidEdge: "#c4c8a6",
  wax: "#ffb144",
  waxLight: "#ffd28a",
  bulb: "#ffe39a",
  bulbOff: "#5b4732",
  neon: "#ffb3e2",
  neonGlow: "#ff3fae",
  pink: "#e7b6a2",
};

// The lamp's parts, as outlines in world units.
const COLLAR = { top: TANK.floor, bottom: TANK.floor + 14 };
function globe(ctx) {
  ctx.beginPath();
  ctx.moveTo(TANK.cx - TANK.halfTop, TANK.top);
  ctx.lineTo(TANK.cx + TANK.halfTop, TANK.top);
  ctx.lineTo(TANK.cx + TANK.halfBottom, TANK.floor);
  ctx.lineTo(TANK.cx - TANK.halfBottom, TANK.floor);
  ctx.closePath();
}
function trapezoid(ctx, y0, half0, y1, half1) {
  ctx.beginPath();
  ctx.moveTo(TANK.cx - half0, y0);
  ctx.lineTo(TANK.cx + half0, y0);
  ctx.lineTo(TANK.cx + half1, y1);
  ctx.lineTo(TANK.cx - half1, y1);
  ctx.closePath();
}

export function draw(ctx, s, F, input) {
  const t = s.time;
  ctx.clearRect(0, 0, FRAME.w, FRAME.h);

  // Cabinet.
  roundRect(ctx, 0, 0, FRAME.w, FRAME.h, 18);
  ctx.fillStyle = C.body;
  ctx.fill();
  ctx.fillStyle = C.bodyDark;
  ctx.fillRect(0, FRAME.h - 22, FRAME.w, 4);

  // Marquee: a neon sign, and bulbs chasing round it.
  roundRect(ctx, 16, 12, 388, 76, 12);
  ctx.fillStyle = C.black;
  ctx.fill();
  for (let i = 0; i < 19; i++) {
    for (const y of [21, 79]) {
      const on = (i + Math.floor(t * 5) + (y > 50 ? 1 : 0)) % 3 === 0;
      ctx.beginPath();
      ctx.arc(30 + i * 20, y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = on ? C.bulb : C.bulbOff;
      ctx.shadowColor = on ? "rgba(255, 210, 110, 0.9)" : "transparent";
      ctx.shadowBlur = on ? 10 : 0;
      ctx.fill();
    }
  }
  ctx.font = '36px "Monoton", "Geist", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.93 + 0.07 * Math.sin(t * 13) * Math.sin(t * 7.3);
  ctx.fillStyle = C.neon;
  ctx.shadowColor = C.neonGlow;
  ctx.shadowBlur = 22;
  ctx.fillText("LAVA CLAW", 210, 52);
  ctx.shadowBlur = 6;
  ctx.fillText("LAVA CLAW", 210, 52);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // The window, dark inside.
  roundRect(ctx, IN.x - 8, IN.y - 8, WORLD.w + 16, WORLD.h + 16, 10);
  ctx.fillStyle = C.black;
  ctx.fill();
  ctx.save();
  ctx.translate(IN.x, IN.y);
  roundRect(ctx, 0, 0, WORLD.w, WORLD.h, 4);
  ctx.clip();
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  // The lamp's glow on the back wall.
  let g = ctx.createRadialGradient(TANK.cx, 330, 20, TANK.cx, 330, 300);
  g.addColorStop(0, "rgba(255, 177, 68, 0.42)");
  g.addColorStop(0.55, "rgba(255, 177, 68, 0.12)");
  g.addColorStop(1, "rgba(255, 177, 68, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  // Rail.
  ctx.fillStyle = C.chrome;
  ctx.fillRect(0, RAIL_Y - 5, WORLD.w, 10);
  ctx.fillStyle = C.chromeLight;
  ctx.fillRect(0, RAIL_Y - 5, WORLD.w, 2);
  ctx.fillStyle = C.chromeDark;
  ctx.fillRect(0, RAIL_Y + 3, WORLD.w, 2);

  // Prize chute.
  ctx.fillStyle = C.cream;
  ctx.fillRect(CHUTE.x0 + 4, CHUTE.top, CHUTE.x1 - 8, WORLD.h - CHUTE.top);
  ctx.fillStyle = C.ink;
  ctx.font = '700 10px "Geist", sans-serif';
  ctx.fillText("PRIZE", (CHUTE.x0 + CHUTE.x1) / 2, CHUTE.top + 16);

  // The lamp: its foot, collar, glass and the liquid.
  trapezoid(ctx, COLLAR.bottom, TANK.halfBottom - 16, WORLD.h + 2, TANK.halfBottom + 18);
  ctx.fillStyle = C.chrome;
  ctx.fill();
  trapezoid(ctx, COLLAR.bottom, TANK.halfBottom - 16, COLLAR.bottom + 3, TANK.halfBottom - 14);
  ctx.fillStyle = C.chromeLight;
  ctx.fill();
  trapezoid(ctx, COLLAR.top, TANK.halfBottom + 4, COLLAR.bottom, TANK.halfBottom - 16);
  ctx.fillStyle = C.chromeDark;
  ctx.fill();

  globe(ctx);
  ctx.fillStyle = C.liquid;
  ctx.fill();
  ctx.save();
  globe(ctx);
  ctx.clip();

  // The wax: flat amber, lighter where it's thickest.
  const outer = waxPath(F, 1);
  ctx.fillStyle = C.wax;
  ctx.strokeStyle = C.wax;
  ctx.lineWidth = 0.8;
  ctx.fill(outer);
  ctx.stroke(outer);
  const inner = waxPath(F, 2.6);
  ctx.fillStyle = C.waxLight;
  ctx.strokeStyle = C.waxLight;
  ctx.fill(inner);
  ctx.stroke(inner);
  ctx.restore();

  // The glass's edges, and a chrome rim round its open top.
  ctx.strokeStyle = C.liquidEdge;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(TANK.cx - TANK.halfTop + 2, TANK.top);
  ctx.lineTo(TANK.cx - TANK.halfBottom + 2, TANK.floor);
  ctx.moveTo(TANK.cx + TANK.halfTop - 2, TANK.top);
  ctx.lineTo(TANK.cx + TANK.halfBottom - 2, TANK.floor);
  ctx.stroke();
  trapezoid(ctx, TANK.top - 12, TANK.halfTop + 2, TANK.top, TANK.halfTop + 8);
  ctx.fillStyle = C.chrome;
  ctx.fill();
  trapezoid(ctx, TANK.top - 12, TANK.halfTop + 2, TANK.top - 9, TANK.halfTop + 3.5);
  ctx.fillStyle = C.chromeLight;
  ctx.fill();

  // Wax the claw has lifted out of the lamp, drawn outside the glass.
  if (s.held || s.blobs.some((b) => b.falling)) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, WORLD.w, WORLD.h);
    globe(ctx);
    ctx.clip("evenodd");
    ctx.fillStyle = C.wax;
    ctx.fill(outer);
    ctx.fillStyle = C.waxLight;
    ctx.fill(inner);
    ctx.restore();
  }

  drawClaw(ctx, s);
  ctx.restore();

  // Deck: the prize door, the joystick, and a lit drop button.
  const deckY = IN.y + WORLD.h + 18;
  roundRect(ctx, 16, deckY, 92, FRAME.h - deckY - 14, 8);
  ctx.fillStyle = C.black;
  ctx.fill();
  ctx.fillStyle = C.cream;
  ctx.font = '700 10px "Geist", sans-serif';
  ctx.fillText("PUSH", 62, deckY + 26);

  roundRect(ctx, 120, deckY, 284, FRAME.h - deckY - 14, 10);
  ctx.fillStyle = C.cream;
  ctx.fill();
  const jy = deckY + 26;
  const tilt = input.dir * 9;
  ctx.fillStyle = C.black;
  ctx.beginPath();
  ctx.ellipse(196, jy + 8, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.chromeDark;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(196, jy + 7);
  ctx.lineTo(196 + tilt, jy - 12);
  ctx.stroke();
  ctx.fillStyle = C.pink;
  ctx.beginPath();
  ctx.arc(196 + tilt, jy - 14, 10, 0, Math.PI * 2);
  ctx.fill();
  const down = s.phase === "drop" && s.timer < 0.25 ? 3 : 0;
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.ellipse(330, jy + 6, 25, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.wax;
  ctx.shadowColor = s.phase === "aim" ? "rgba(255, 177, 68, 0.9)" : "transparent";
  ctx.shadowBlur = s.phase === "aim" ? 12 : 0;
  ctx.beginPath();
  ctx.ellipse(330, jy + down, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = C.ink;
  ctx.fillText("DROP", 330, jy + 24);
}

function drawClaw(ctx, s) {
  const c = s.carriage;
  const p = clawPoint(s);
  ctx.fillStyle = C.chromeDark;
  ctx.fillRect(c.x - 17, RAIL_Y - 10, 34, 20);
  ctx.fillStyle = C.chrome;
  ctx.fillRect(c.x - 17, RAIL_Y - 10, 34, 4);
  ctx.strokeStyle = C.chrome;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(c.x, RAIL_Y + 8);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-s.claw.angle);
  const open = prongAngle(s.claw.grip);
  prong(ctx, 0, 12, 0, 0.75, C.chromeDark);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    prong(ctx, 9, 11, open, 1, C.chrome);
    ctx.restore();
  }
  ctx.fillStyle = C.chrome;
  ctx.fillRect(-13, -6, 26, 20);
  ctx.fillStyle = C.chromeLight;
  ctx.fillRect(-13, -6, 26, 4);
  ctx.fillStyle = C.chromeDark;
  ctx.fillRect(-13, 10, 26, 4);
  ctx.restore();
}

function prong(ctx, px, py, open, scale, color) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-open);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(9, 12, 6, 26);
  ctx.quadraticCurveTo(4, 32, -3, 35);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 6;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}
