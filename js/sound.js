// The machine's sounds, made with the Web Audio API so there are no
// recordings to license: a motor hum while the claw moves, a clank when it
// shuts, a bloop for a grab, a sad slide for a slip, a jingle for a win.

let ctx = null;
let out = null;
let hum = null;
let on = true;

export function audio() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    out = ctx.createGain();
    out.gain.value = on ? 0.6 : 0;
    out.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setOn(value) {
  on = value;
  if (out) out.gain.value = value ? 0.6 : 0;
}

function tone(type, from, to, length, volume, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + length);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(env).connect(out);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

function noise(length, volume, freq) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 3;
  const env = ctx.createGain();
  env.gain.value = volume;
  src.connect(filter).connect(env).connect(out);
  src.start(t);
}

export function play(event) {
  if (!ctx || !on) return;
  if (event === "drop") tone("triangle", 520, 260, 0.25, 0.12);
  if (event === "clank") {
    noise(0.12, 0.5, 2400);
    tone("square", 900, 600, 0.08, 0.05);
  }
  if (event === "grab") tone("sine", 280, 720, 0.28, 0.2);
  if (event === "slip") tone("sine", 600, 150, 0.6, 0.18);
  if (event === "plop") tone("sine", 160, 70, 0.3, 0.3);
  if (event === "win") [660, 830, 990, 1320].forEach((f, i) => tone("triangle", f, f, 0.16, 0.12, 0.12 + i * 0.09));
}

// The motor: louder and higher the faster the claw or its cable moves.
export function motor(speed) {
  if (!ctx) return;
  if (!hum) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(filter).connect(gain).connect(out);
    osc.start();
    hum = { osc, gain };
  }
  const level = Math.min(1, speed / 160);
  hum.gain.gain.setTargetAtTime(on ? level * 0.05 : 0, ctx.currentTime, 0.05);
  hum.osc.frequency.setTargetAtTime(70 + level * 50, ctx.currentTime, 0.05);
}
