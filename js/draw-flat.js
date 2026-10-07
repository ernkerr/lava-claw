// The flat cartoon machine, in the style of the About room: straight on,
// flat colors and crisp edges, no gradients or glow. Its lava lamp borrows
// the room's lamp: a chrome collar and foot, pale lit liquid, amber wax.

import { WORLD, RAIL_Y, CHUTE, TANK, clawPoint } from "./game.js";
import { FRAME, IN, prongAngle, roundRect } from "./layout.js";
import { waxPath } from "./field.js";

const C = {
  body: "#e8b2b4",
  bodyDark: "#d69a9d",
  ink: "#4a3527",
  cream: "#fff3d2",
  frame: "#1e1d1b",
  wall: "#fbefe6",
  chrome: "#c9ced3",
  chromeLight: "#f0f3f5",
  chromeDark: "#878e95",
  liquid: "#eef4a6",
  liquidEdge: "#c4c8a6",
  wax: "#ffb144",
  waxLight: "#ffd28a",
  bulb: "#e2b35e",
  bulbOff: "#c9a77a",
  pink: "#e7b6a2",
};

export function drawFlat(ctx, s, F, input) {
  const t = s.time;
  ctx.clearRect(0, 0, FRAME.w, FRAME.h);

  // Cabinet.
  roundRect(ctx, 0, 0, FRAME.w, FRAME.h, 18);
  ctx.fillStyle = C.body;
  ctx.fill();
  ctx.fillStyle = C.bodyDark;
  ctx.fillRect(0, FRAME.h - 22, FRAME.w, 4);

  // Marquee.
  roundRect(ctx, 16, 12, 388, 76, 12);
  ctx.fillStyle = C.cream;
  ctx.fill();
  for (let i = 0; i < 19; i++) {
    for (const y of [21, 79]) {
      const on = (i + Math.floor(t * 5) + (y > 50 ? 1 : 0)) % 3 === 0;
      ctx.beginPath();
      ctx.arc(30 + i * 20, y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = on ? C.bulb : C.bulbOff;
      ctx.fill();
    }
  }
  ctx.fillStyle = C.ink;
  ctx.font = '800 34px "Geist", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LAVA CLAW", 210, 51);

  // The window.
  roundRect(ctx, IN.x - 8, IN.y - 8, WORLD.w + 16, WORLD.h + 16, 10);
  ctx.fillStyle = C.frame;
  ctx.fill();
  ctx.save();
  ctx.translate(IN.x, IN.y);
  roundRect(ctx, 0, 0, WORLD.w, WORLD.h, 4);
  ctx.clip();
  ctx.fillStyle = C.wall;
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
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(CHUTE.x0 + 4, CHUTE.top, CHUTE.x1 - 8, WORLD.h - CHUTE.top + 4);
  ctx.fillStyle = C.ink;
  ctx.font = '700 10px "Geist", sans-serif';
  ctx.fillText("PRIZE", (CHUTE.x0 + CHUTE.x1) / 2, CHUTE.top + 16);

  // The lava lamp: pale liquid, a chrome collar on top and a foot below.
  const tw = TANK.x1 - TANK.x0;
  ctx.fillStyle = C.liquid;
  ctx.fillRect(TANK.x0, TANK.top, tw, TANK.floor - TANK.top);
  ctx.fillStyle = C.liquidEdge;
  ctx.fillRect(TANK.x0, TANK.top, 5, TANK.floor - TANK.top);
  ctx.fillRect(TANK.x1 - 5, TANK.top, 5, TANK.floor - TANK.top);

  // The wax: flat amber, with a lighter middle where it's thickest.
  ctx.save();
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

  ctx.fillStyle = C.chrome;
  ctx.fillRect(TANK.x0 - 6, TANK.top - 10, tw + 12, 12);
  ctx.fillStyle = C.chromeLight;
  ctx.fillRect(TANK.x0 - 6, TANK.top - 10, tw + 12, 3);
  ctx.beginPath();
  ctx.moveTo(TANK.x0 - 4, TANK.floor);
  ctx.lineTo(TANK.x1 + 4, TANK.floor);
  ctx.lineTo(TANK.x1 + 12, WORLD.h);
  ctx.lineTo(TANK.x0 - 12, WORLD.h);
  ctx.closePath();
  ctx.fillStyle = C.chrome;
  ctx.fill();
  ctx.fillStyle = C.chromeLight;
  ctx.fillRect(TANK.x0 - 4, TANK.floor, tw + 8, 3);

  drawClaw(ctx, s);
  ctx.restore();

  // Deck.
  const deckY = IN.y + WORLD.h + 18;
  roundRect(ctx, 16, deckY, 92, FRAME.h - deckY - 14, 8);
  ctx.fillStyle = C.frame;
  ctx.fill();
  ctx.fillStyle = C.cream;
  ctx.font = '700 10px "Geist", sans-serif';
  ctx.fillText("PUSH", 62, deckY + 26);

  roundRect(ctx, 120, deckY, 284, FRAME.h - deckY - 14, 10);
  ctx.fillStyle = C.cream;
  ctx.fill();
  const jy = deckY + 26;
  const tilt = input.dir * 9;
  ctx.fillStyle = C.frame;
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
  ctx.beginPath();
  ctx.ellipse(330, jy + down, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.fillText("DROP", 330, jy + 24);
}

function drawClaw(ctx, s) {
  const c = s.carriage;
  const p = clawPoint(s);
  ctx.fillStyle = C.frame;
  ctx.fillRect(c.x - 17, RAIL_Y - 10, 34, 20);
  ctx.strokeStyle = C.frame;
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
