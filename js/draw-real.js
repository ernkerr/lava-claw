// The real-looking machine: a dark lacquered cabinet with a neon marquee
// and chasing bulbs, a giant lava lamp inside (deep violet liquid, glowing
// amber wax, warm light from the bulb underneath), a chrome claw, and glass
// in front catching the light.

import { WORLD, RAIL_Y, CHUTE, TANK, clawPoint } from "./game.js";
import { FRAME, IN, prongAngle, roundRect } from "./layout.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- The wax, shaded one pixel per field cell, then scaled up smooth ----

const wax = document.createElement("canvas");
const bloom = document.createElement("canvas");
let waxCtx;
let bloomCtx;
let img;

const L = (() => {
  const v = [-0.45, -0.7, 0.55];
  const n = Math.hypot(...v);
  return v.map((c) => c / n);
})();

function shadeWax(F) {
  const { values: v, cols, rows } = F;
  if (!img) {
    wax.width = cols;
    wax.height = rows;
    waxCtx = wax.getContext("2d");
    img = waxCtx.createImageData(cols, rows);
    bloom.width = Math.ceil(cols / 7);
    bloom.height = Math.ceil(rows / 7);
    bloomCtx = bloom.getContext("2d");
  }
  const d = img.data;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const f = v[k];
      const o = k * 4;
      if (f < 0.75) {
        d[o + 3] = 0;
        continue;
      }
      // A surface normal from how the field slopes, so each blob reads as
      // a rounded, glossy lump lit from the upper left.
      const gx = (v[i < cols - 1 ? k + 1 : k] - v[i > 0 ? k - 1 : k]) / f;
      const gy = (v[j < rows - 1 ? k + cols : k] - v[j > 0 ? k - cols : k]) / f;
      let nx = -gx * 1.6;
      let ny = -gy * 1.6;
      let nz = 1;
      const n = Math.hypot(nx, ny, nz);
      nx /= n;
      ny /= n;
      nz /= n;
      const diffuse = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const spec = diffuse ** 24;
      // Wax glows from inside, hotter toward the middle, and the bulb below
      // lights its undersides; it never goes dark like a solid ball.
      const core = clamp((f - 1) / 3.5, 0, 1);
      const under = Math.max(0, ny) * 0.3;
      const shade = 0.74 + 0.36 * diffuse + under;
      d[o] = Math.min(255, 255 * shade + 255 * spec * 0.5);
      d[o + 1] = Math.min(255, (70 + 125 * core) * shade + 255 * spec * 0.5 + under * 60);
      d[o + 2] = Math.min(255, (22 + 50 * core) * shade + 255 * spec * 0.4);
      d[o + 3] = 250 * clamp((f - 0.82) / 0.24, 0, 1);
    }
  }
  waxCtx.putImageData(img, 0, 0);
  bloomCtx.clearRect(0, 0, bloom.width, bloom.height);
  bloomCtx.drawImage(wax, 0, 0, bloom.width, bloom.height);
}

function chrome(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#f4f7fa");
  g.addColorStop(0.35, "#c3cad2");
  g.addColorStop(0.55, "#8d96a1");
  g.addColorStop(0.8, "#d9dee4");
  g.addColorStop(1, "#6d7681");
  return g;
}

// ---- The machine ----

export function drawReal(ctx, s, F, input) {
  const t = s.time;
  shadeWax(F);
  ctx.clearRect(0, 0, FRAME.w, FRAME.h);

  // Cabinet: dark lacquer with a soft sheen down the left.
  let g = ctx.createLinearGradient(0, 0, 0, FRAME.h);
  g.addColorStop(0, "#2d2139");
  g.addColorStop(1, "#150f1c");
  roundRect(ctx, 0, 0, FRAME.w, FRAME.h, 18);
  ctx.fillStyle = g;
  ctx.fill();
  g = ctx.createLinearGradient(0, 0, FRAME.w, 0);
  g.addColorStop(0, "rgba(255,255,255,0.10)");
  g.addColorStop(0.08, "rgba(255,255,255,0)");
  g.addColorStop(0.92, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = g;
  ctx.fill();

  // Marquee: neon letters and chasing bulbs.
  roundRect(ctx, 16, 12, 388, 76, 12);
  ctx.fillStyle = "#110b17";
  ctx.fill();
  ctx.strokeStyle = "#3d2f4b";
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 19; i++) {
    for (const y of [21, 79]) {
      const x = 30 + i * 20;
      const on = (i + Math.floor(t * 5) + (y > 50 ? 1 : 0)) % 3 === 0;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = on ? "#ffe39a" : "#5b4732";
      ctx.shadowColor = on ? "rgba(255, 210, 110, 0.9)" : "transparent";
      ctx.shadowBlur = on ? 10 : 0;
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  ctx.font = '36px "Monoton", "Geist", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const flicker = 0.92 + 0.08 * Math.sin(t * 13) * Math.sin(t * 7.3);
  ctx.globalAlpha = flicker;
  ctx.shadowColor = "#ff3fae";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#ffb3e2";
  ctx.fillText("LAVA CLAW", 210, 52);
  ctx.shadowBlur = 6;
  ctx.fillText("LAVA CLAW", 210, 52);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  // The window: a chrome-edged opening onto the inside.
  roundRect(ctx, IN.x - 8, IN.y - 8, WORLD.w + 16, WORLD.h + 16, 10);
  ctx.fillStyle = chrome(ctx, 0, IN.y - 8, 0, IN.y + WORLD.h + 8);
  ctx.fill();
  ctx.save();
  ctx.translate(IN.x, IN.y);
  roundRect(ctx, 0, 0, WORLD.w, WORLD.h, 4);
  ctx.clip();

  // Back wall, lit violet by the lamp.
  g = ctx.createLinearGradient(0, 0, 0, WORLD.h);
  g.addColorStop(0, "#1b1226");
  g.addColorStop(1, "#0c0811");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  g = ctx.createRadialGradient(218, 380, 10, 218, 380, 300);
  g.addColorStop(0, "rgba(160, 60, 160, 0.35)");
  g.addColorStop(1, "rgba(160, 60, 160, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  // The rail across the top.
  ctx.fillStyle = chrome(ctx, 0, RAIL_Y - 5, 0, RAIL_Y + 5);
  ctx.fillRect(0, RAIL_Y - 5, WORLD.w, 10);

  // The prize chute: a clear acrylic box.
  ctx.fillStyle = "rgba(190, 210, 255, 0.07)";
  ctx.fillRect(CHUTE.x0 + 4, CHUTE.top, CHUTE.x1 - 8, WORLD.h - CHUTE.top);
  ctx.strokeStyle = "rgba(220, 235, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(CHUTE.x0 + 4, CHUTE.top, CHUTE.x1 - 8, WORLD.h - CHUTE.top + 4);
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.font = '600 10px "Geist", sans-serif';
  ctx.fillText("PRIZE", (CHUTE.x0 + CHUTE.x1) / 2, CHUTE.top + 16);

  // The lava lamp: liquid lit from the bulb below, round like a bottle.
  const tw = TANK.x1 - TANK.x0;
  const th = TANK.floor - TANK.top;
  g = ctx.createLinearGradient(0, TANK.top, 0, TANK.floor);
  g.addColorStop(0, "#22103f");
  g.addColorStop(0.55, "#3b1462");
  g.addColorStop(1, "#6a1d63");
  ctx.fillStyle = g;
  ctx.fillRect(TANK.x0, TANK.top, tw, th);
  g = ctx.createRadialGradient(TANK.x0 + tw / 2, TANK.floor + 20, 10, TANK.x0 + tw / 2, TANK.floor + 20, 260);
  g.addColorStop(0, "rgba(255, 150, 70, 0.6)");
  g.addColorStop(0.5, "rgba(255, 90, 90, 0.18)");
  g.addColorStop(1, "rgba(255, 90, 90, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(TANK.x0, TANK.top, tw, th);

  // The wax, and its glow in the liquid.
  const half = F.cell / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(wax, -half, -half, F.cols * F.cell, F.rows * F.cell);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.32;
  ctx.drawImage(bloom, -half, -half, F.cols * F.cell, F.rows * F.cell);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // The bottle's roundness: its sides in shade, a light down its front.
  g = ctx.createLinearGradient(TANK.x0, 0, TANK.x1, 0);
  g.addColorStop(0, "rgba(0, 0, 0, 0.45)");
  g.addColorStop(0.18, "rgba(0, 0, 0, 0)");
  g.addColorStop(0.3, "rgba(255, 255, 255, 0.07)");
  g.addColorStop(0.36, "rgba(255, 255, 255, 0)");
  g.addColorStop(0.82, "rgba(0, 0, 0, 0)");
  g.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = g;
  ctx.fillRect(TANK.x0, TANK.top, tw, th);
  ctx.strokeStyle = "rgba(230, 220, 255, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(TANK.x0, TANK.top, tw, th);
  // Chrome collar at the top and foot at the bottom, like a lava lamp.
  ctx.fillStyle = chrome(ctx, 0, TANK.top - 10, 0, TANK.top + 2);
  roundRect(ctx, TANK.x0 - 6, TANK.top - 10, tw + 12, 12, 3);
  ctx.fill();
  ctx.fillStyle = chrome(ctx, TANK.x0, 0, TANK.x1, 0);
  ctx.beginPath();
  ctx.moveTo(TANK.x0 - 4, TANK.floor);
  ctx.lineTo(TANK.x1 + 4, TANK.floor);
  ctx.lineTo(TANK.x1 + 12, WORLD.h);
  ctx.lineTo(TANK.x0 - 12, WORLD.h);
  ctx.closePath();
  ctx.fill();

  drawClaw(ctx, s);

  // Glass in front of it all, catching the light.
  g = ctx.createLinearGradient(0, 0, WORLD.w, WORLD.h);
  g.addColorStop(0.1, "rgba(255, 255, 255, 0)");
  g.addColorStop(0.16, "rgba(255, 255, 255, 0.07)");
  g.addColorStop(0.24, "rgba(255, 255, 255, 0)");
  g.addColorStop(0.3, "rgba(255, 255, 255, 0.04)");
  g.addColorStop(0.33, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  ctx.restore();

  // The deck: the prize door, the joystick and the drop button.
  const deckY = IN.y + WORLD.h + 18;
  roundRect(ctx, 16, deckY, 92, FRAME.h - deckY - 14, 8);
  ctx.fillStyle = "#0d0910";
  ctx.fill();
  ctx.strokeStyle = chrome(ctx, 0, deckY, 0, FRAME.h - 14);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = '600 10px "Geist", sans-serif';
  ctx.fillText("PUSH", 62, deckY + 26);

  roundRect(ctx, 120, deckY, 284, FRAME.h - deckY - 14, 10);
  g = ctx.createLinearGradient(0, deckY, 0, FRAME.h);
  g.addColorStop(0, "#3a2c48");
  g.addColorStop(1, "#1d1526");
  ctx.fillStyle = g;
  ctx.fill();
  const jy = deckY + 26;
  const tilt = input.dir * 9;
  ctx.fillStyle = "#0b0810";
  ctx.beginPath();
  ctx.ellipse(196, jy + 8, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = chrome(ctx, 190, 0, 202, 0);
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(196, jy + 7);
  ctx.lineTo(196 + tilt, jy - 12);
  ctx.stroke();
  g = ctx.createRadialGradient(193 + tilt, jy - 18, 1, 196 + tilt, jy - 14, 11);
  g.addColorStop(0, "#ff8fa6");
  g.addColorStop(1, "#c4153c");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(196 + tilt, jy - 14, 10, 0, Math.PI * 2);
  ctx.fill();
  const down = s.phase === "drop" && s.timer < 0.25 ? 3 : 0;
  ctx.fillStyle = "#4d0f22";
  ctx.beginPath();
  ctx.ellipse(330, jy + 6, 26, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  g = ctx.createRadialGradient(324, jy - 6 + down, 2, 330, jy + down, 26);
  g.addColorStop(0, "#ff9ac0");
  g.addColorStop(1, "#d81e63");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(330, jy + down, 24, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("DROP", 330, jy + 24);
}

function drawClaw(ctx, s) {
  const c = s.carriage;
  const p = clawPoint(s);
  // The carriage on its rail.
  roundRect(ctx, c.x - 17, RAIL_Y - 10, 34, 20, 4);
  ctx.fillStyle = "#2b2f36";
  ctx.fill();
  ctx.fillStyle = chrome(ctx, 0, RAIL_Y - 10, 0, RAIL_Y + 10);
  ctx.fillRect(c.x - 17, RAIL_Y - 10, 34, 4);
  // The cable.
  ctx.strokeStyle = "#1a1c21";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(c.x, RAIL_Y + 8);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.strokeStyle = "rgba(200, 205, 215, 0.6)";
  ctx.lineWidth = 0.7;
  ctx.stroke();

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-s.claw.angle);
  const open = prongAngle(s.claw.grip);
  // The back prong, in shade.
  prong(ctx, 0, 12, 0, 0.75, "#4e5560");
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    prong(ctx, 9, 11, open, 1, null);
    ctx.restore();
  }
  // The motor head.
  roundRect(ctx, -13, -6, 26, 20, 5);
  ctx.fillStyle = chrome(ctx, -13, 0, 13, 0);
  ctx.fill();
  ctx.fillStyle = "#30353d";
  ctx.fillRect(-13, 9, 26, 3);
  ctx.restore();
}

// One prong: a curved finger hanging from its pivot, swung open by `open`.
function prong(ctx, px, py, open, scale, flat) {
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
  ctx.strokeStyle = flat || chrome(ctx, -4, 0, 10, 0);
  ctx.stroke();
  if (!flat) {
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.stroke();
  }
  ctx.restore();
}
