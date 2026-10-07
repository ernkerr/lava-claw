// The wax as a field over the machine: each blob adds r² / d², and where the
// total is 1 or more there's wax. Blobs that come close run together, the
// way lava lamp wax does. Both looks draw from this one field.

import { WORLD, TANK } from "./game.js";

export const CELL = 3;
export const COLS = Math.ceil(WORLD.w / CELL) + 1;
export const ROWS = Math.ceil(WORLD.h / CELL) + 1;
const values = new Float32Array(COLS * ROWS);

export function computeField(blobs, time) {
  values.fill(0);
  for (const b of blobs) {
    const reach = b.r * 3.2;
    const r2 = b.r * b.r;
    const i0 = Math.max(0, Math.floor((b.x - reach) / CELL));
    const i1 = Math.min(COLS - 1, Math.ceil((b.x + reach) / CELL));
    const j0 = Math.max(0, Math.floor((b.y - reach) / CELL));
    const j1 = Math.min(ROWS - 1, Math.ceil((b.y + reach) / CELL));
    for (let j = j0; j <= j1; j++) {
      const dy = j * CELL - b.y;
      const row = j * COLS;
      for (let i = i0; i <= i1; i++) {
        const dx = i * CELL - b.x;
        values[row + i] += r2 / (dx * dx + dy * dy + 1);
      }
    }
  }
  // The lump of wax lying on the tank's floor, its top gently rolling.
  const i0 = Math.ceil(TANK.x0 / CELL);
  const i1 = Math.floor(TANK.x1 / CELL);
  const jf = Math.floor(TANK.floor / CELL);
  for (let i = i0; i <= i1; i++) {
    const x = i * CELL;
    const top = TANK.floor - 11 + 3 * Math.sin(x * 0.05 + time * 0.6) + 2 * Math.sin(x * 0.12 - time * 0.45);
    const j0 = Math.max(0, Math.floor((top - 30) / CELL));
    for (let j = j0; j <= jf; j++) {
      values[j * COLS + i] += Math.exp((j * CELL - top) / 5);
    }
  }
  return { values, cols: COLS, rows: ROWS, cell: CELL };
}

// The wax's outline as a filled shape (marching squares): each cell of the
// grid adds the part of itself that's inside.
export function waxPath(F, iso) {
  const { values: v, cols, rows, cell } = F;
  const path = new Path2D();
  const lerp = (a, b) => (iso - a) / (b - a);
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = v[j * cols + i];
      const b = v[j * cols + i + 1];
      const c = v[(j + 1) * cols + i + 1];
      const d = v[(j + 1) * cols + i];
      const inA = a >= iso;
      const inB = b >= iso;
      const inC = c >= iso;
      const inD = d >= iso;
      if (!inA && !inB && !inC && !inD) continue;
      const x = i * cell;
      const y = j * cell;
      if (inA && inB && inC && inD) {
        path.rect(x, y, cell, cell);
        continue;
      }
      const pts = [];
      // Around the cell: top-left, top-right, bottom-right, bottom-left.
      if (inA) pts.push(x, y);
      if (inA !== inB) pts.push(x + cell * lerp(a, b), y);
      if (inB) pts.push(x + cell, y);
      if (inB !== inC) pts.push(x + cell, y + cell * lerp(b, c));
      if (inC) pts.push(x + cell, y + cell);
      if (inC !== inD) pts.push(x + cell * (1 - lerp(c, d)), y + cell);
      if (inD) pts.push(x, y + cell);
      if (inD !== inA) pts.push(x, y + cell * (1 - lerp(d, a)));
      path.moveTo(pts[0], pts[1]);
      for (let k = 2; k < pts.length; k += 2) path.lineTo(pts[k], pts[k + 1]);
      path.closePath();
    }
  }
  return path;
}
