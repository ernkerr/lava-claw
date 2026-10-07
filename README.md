# Lava Claw

A claw machine where the prizes are the wax blobs in a giant lava lamp. The
blobs rise and sink, split and melt together, the way lava lamp wax does.
Steer the claw, but it swings on its cable: wait for it to settle, then drop
it and grab a blob as it drifts by. Play at
**https://ernkerr.github.io/lava-claw/**.

For now the page shows two looks side by side, a real-looking machine and a
flat cartoon one, running the same game at once.

## Play

- **← →** (or A and D) steer the claw. It swings when you stop.
- **Space** (or Enter or ↓) drops it.
- On a phone, use the arrow and Drop buttons.

A centered grab on a small blob is a sure thing. Big blobs, off-center grabs
and a swinging claw can slip. Caught blobs land in the prize chute, and the
lamp makes new ones from the wax at the bottom.

## How it works

No build step; open it with any static server (`python3 -m http.server`).

| file | what it is |
| --- | --- |
| `js/game.js` | the game: lava physics, the claw's swing, grabbing and slipping |
| `js/field.js` | the wax as a metaball field, so blobs melt into each other |
| `js/draw-real.js`, `js/draw-flat.js` | the two looks, drawing the same state |
| `js/sound.js` | the machine's sounds, made with Web Audio |
| `js/main.js` | controls and the loop |

## Credits

Made by Erin Kerr. Fonts from Google Fonts: Geist, Newsreader and Monoton
(all OFL).
