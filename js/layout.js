// The machine as both looks draw it: a cabinet 420 by 700, with the inside
// of the game (world 0, 0) at IN, a marquee above and a control deck below.

export const FRAME = { w: 420, h: 700 };
export const IN = { x: 30, y: 104 };

// How far the claw's prongs are open: 1 open, 0 shut.
export const prongAngle = (grip) => 0.1 + 0.62 * grip;

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
