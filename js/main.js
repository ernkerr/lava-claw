import { newGame, step, clawPoint } from "./game.js";
import { computeField } from "./field.js";
import { FRAME } from "./layout.js";
import { draw } from "./draw.js";
import * as sound from "./sound.js";

const $ = (sel) => document.querySelector(sel);
const canvas = $("#machine");
const ctx = canvas.getContext("2d");

const state = newGame();
const SAVE = "lava-claw:caught";
try {
  state.caught = Number(localStorage.getItem(SAVE)) || 0;
} catch {
  // Starting from zero is fine.
}

// ---- Size: the canvases match their place on the page, sharp on any screen ----

let scale = 1;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  scale = (rect.width / FRAME.w) * dpr;
}
new ResizeObserver(resize).observe(canvas);

// ---- Controls: arrow keys or A/D to steer, Space, Enter or Down to drop ----

const held = { left: false, right: false, keyLeft: false, keyRight: false };
let dropPressed = false;
const LEFT = ["ArrowLeft", "KeyA"];
const RIGHT = ["ArrowRight", "KeyD"];
const DROP = ["Space", "Enter", "ArrowDown", "KeyS"];

window.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if ((e.code === "Space" || e.code === "Enter") && e.target.closest?.("button, a")) return;
  if (LEFT.includes(e.code)) held.keyLeft = true;
  else if (RIGHT.includes(e.code)) held.keyRight = true;
  else if (DROP.includes(e.code)) {
    if (!e.repeat) dropPressed = true;
  } else return;
  e.preventDefault();
  sound.audio();
});
window.addEventListener("keyup", (e) => {
  if (LEFT.includes(e.code)) held.keyLeft = false;
  if (RIGHT.includes(e.code)) held.keyRight = false;
});
window.addEventListener("blur", () => {
  held.keyLeft = held.keyRight = held.left = held.right = false;
});

// Touch and mouse: hold the arrows, tap Drop.
for (const btn of document.querySelectorAll("[data-steer]")) {
  const side = btn.dataset.steer;
  const set = (v) => {
    held[side] = v;
    btn.classList.toggle("down", v);
  };
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    sound.audio();
    btn.setPointerCapture?.(e.pointerId);
    set(true);
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) btn.addEventListener(type, () => set(false));
}
$("#drop").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  sound.audio();
  dropPressed = true;
});

const soundBtn = $("#sound");
let soundOn = true;
soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  sound.setOn(soundOn);
  soundBtn.textContent = soundOn ? "Sound on" : "Sound off";
  soundBtn.setAttribute("aria-pressed", String(soundOn));
});

// ---- Words under the machine ----

const status = $("#status");
const count = $("#count");
const LINES = {
  aim: "Steer the claw, let it settle, then drop.",
  drop: "Going down...",
  close: "Going down...",
  rise: "Up it comes...",
  return: "Up it comes...",
  release: "Up it comes...",
};
let said = "";
let sayUntil = 0;
function say(text, hold = 0) {
  if (text !== said) status.textContent = said = text;
  sayUntil = hold;
}

// ---- The loop ----

let last = performance.now();
let lastLen = state.claw.len;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const dir = (held.left || held.keyLeft ? -1 : 0) + (held.right || held.keyRight ? 1 : 0);
  const input = { dir, drop: dropPressed };
  dropPressed = false;
  // Small steps keep the swinging steady.
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  for (let i = 0; i < steps; i++) {
    step(state, dt / steps, { dir, drop: i === 0 && input.drop });
    for (const e of state.events) {
      sound.play(e);
      if (e === "grab") say("Got one!", now + 1600);
      if (e === "slip") say("It slipped!", now + 1800);
      if (e === "win") {
        say("Yours! It's in the prize chute.", now + 2200);
        count.textContent = state.caught;
        try {
          localStorage.setItem(SAVE, String(state.caught));
        } catch {
          // Fine to forget.
        }
      }
      if (e === "clank" && !state.held) say("Missed.", now + 1400);
    }
  }
  if (now > sayUntil) say(LINES[state.phase]);
  const cableSpeed = Math.abs(state.claw.len - lastLen) / Math.max(dt, 1e-3);
  lastLen = state.claw.len;
  sound.motor(Math.max(Math.abs(state.carriage.v), cableSpeed));

  const F = computeField(state.blobs, state.time);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  draw(ctx, state, F, input);
}

count.textContent = state.caught;
resize();
document.fonts.load('36px "Monoton"').finally(() => requestAnimationFrame(frame));

// For checking the game from a test.
window.__lava = { state, clawPoint };
