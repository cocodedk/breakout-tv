# Breakout: the whole game

## Goal

The classic arcade game Breakout on the owner's 2021 Samsung TV, played on the couch with a
keyboard plugged into the TV, or with the TV remote when no keyboard is at hand. A paddle at the
bottom bounces a ball into a wall of coloured bricks; every brick broken scores; the ball lost past
the paddle costs a life. Three levels, then they repeat faster. It must feel smooth and responsive
on the TV: the paddle moves for as long as a key is held and stops the moment it is let go.

Today the repository is an empty shell: `index.html` shows the word "Breakout" and a build stamp.
This spec builds the whole game on it.

## The design to match

The app icon (`icon.png`) is the design: a deep navy stage, `#070b1e`, five rows of bricks in
`#ff5a4a` (red), `#ffaa3c` (orange), `#ffd447` (yellow), `#4be38e` (green) and `#5aa9ff` (blue), a
white ball and a white paddle. Two-hit bricks are silver, `#c8d0e0`, and turn to `#7d869a` after
the first hit. Text is white, or `#ffd447` for what is focused or important. Font: the system
`sans-serif`, bold for headings. No web fonts, no image files beyond `icon.png`, no network.
Corners: bricks and the paddle have a 6px radius; dialogs have a 16px radius, a `#0f1736`
background and a 4px `#5aa9ff` border.

## The screen

Fixed 1920×1080, as `CLAUDE.md` requires.

- **HUD**, a row at the top: "Score 1234" at left 160px, "Level 2" centred, "Lives ● ● ●" (one
  white dot per life left) right-aligned to 1760px. Text 40px, top of the row 56px from the top.
- **Playfield**: one `<canvas id="playfield">`, 1600×880, at left 160px, top 152px, with a 2px
  `#1f2a55` border. Everything that moves is drawn on it; the HUD and every screen's text are DOM.
- **Build stamp**: `#build-stamp`, as today, bottom right.

All positions and sizes below are in playfield pixels (origin at the canvas's top left).

## Screens and states

The screens are `<section>`s toggled with `hidden`. Exactly one screen is shown at a time; a dialog
sits over a screen.

1. **Title** (`#screen-title`, shown at start). "Breakout" (`#title-name`, 160px, kept as today),
   below it "Press Enter or OK to start" (`#title-start`, `#ffd447`, 48px), "Best score: 1234" or
   "Best score: —" when none (`#title-best`, 36px), and three control lines (32px):
   "Move: ← → or A D", "Launch: Space, Enter or OK", "Pause: P or Back".
   - Enter, Space or OK starts a new game: score 0, lives 3, level 1.
   - Back opens the leave dialog.
2. **Play** (`#screen-play`: the HUD and the playfield). Sub-states:
   - **Serve**: the ball rests on the paddle's centre and moves with it. "Press Space or OK to
     launch" (`#play-hint`, 36px, centred in the playfield, 300px below its top) shows. Space,
     Enter or OK launches.
   - **Moving**: the ball flies; the hint is hidden.
   - **Level banner**: when the last breakable brick of a level falls, "Level N" (`#play-banner`,
     96px, `#ffd447`) shows for 1.5 s with the ball frozen, then the next level's wall appears in
     Serve. Keys other than Back, P and M do nothing during the banner (M toggles sound at any time,
     as Sound says).
   - Back or P opens the pause dialog from any sub-state.
3. **Game over** (`#screen-over`). "Game over" (120px), "Score 1234" (64px), "Best score 1234"
   (40px), and "New best!" (`#over-new-best`, `#ffd447`, 40px) only when this game beat the saved
   best. Two choices (48px): "Play again" (`#over-again`) and "Title" (`#over-title`), side by side,
   "Play again" focused at first. Left/Right (or A/D) moves focus, Enter/Space/OK picks.
   Back goes to the title.
4. **Pause dialog** (`#dialog-pause`). "Paused" and two choices stacked: "Resume" (focused) and
   "Quit to title". Up/Down (or W/S) moves focus; Enter/Space/OK picks. Back or P resumes. The game
   is frozen beneath it and nothing moves. Quit to title ends the game without saving its score as
   best.
5. **Leave dialog** (`#dialog-leave`, over the title only). "Leave Breakout?" and two choices side
   by side: "Stay" (focused) and "Leave". Left/Right moves focus, Enter/Space/OK picks, Back stays.
   Leave calls `tizen.application.getCurrentApplication().exit()` in try/catch; in a desktop browser
   that throws and the dialog simply closes.

Focus is the `.focused` class: the focused choice gets a `#ffd447` 4px border and `#ffd447` text;
the other choice a 4px `#3a4677` border and white text.

## Input

Key codes, read from `event.keyCode`:

| Action | Keys |
|---|---|
| Move left | Left 37, A 65 |
| Move right | Right 39, D 68 |
| Up / Down in menus | Up 38, W 87 / Down 40, S 83 |
| Launch, confirm | Space 32, Enter 13 (OK on the remote is 13) |
| Pause | P 80 |
| Back | Back 10009, Escape 27, Backspace 8 |
| Mute | M 77 |

- **Holding.** A move key held moves the paddle until released, starting at 900 px/s and speeding
  up by 6000 px/s every second to 2400 px/s (a quarter of a second); letting go or turning round
  starts the climb again. Keydown starts the move; keyup of that key ends it. Repeated keydowns from auto-repeat change nothing. Both
  directions held: the one pressed last wins; releasing it goes back to the other if still held.
- **A remote that sends no keyup.** Until the app has seen at least one keyup event, a held
  direction also ends 600 ms after that key's last keydown. Once any keyup has been seen, only
  keyup ends a move.
- Losing focus (`blur`) or the page going hidden (`visibilitychange`) releases every held key, and
  in Moving or Serve opens the pause dialog.
- `preventDefault()` on every key the game handles, so Space and Backspace never scroll or navigate.
- No colour keys are used, so nothing is registered with `tizen.tvinputdevice`.

## The game

- **Paddle**: 240×24, its top at y 816, centred at start of every serve. Kept inside the playfield.
- **Ball**: radius 12. Launches from the paddle 30° to the right of straight up, at the current
  speed (see Speed), every launch: at the start of a level and after a lost life alike.
- **Walls**: the left, right and top edges reflect the ball. Passing the bottom edge loses it.
- **Paddle bounce**: when the ball comes down onto the paddle's top, it leaves upward at an angle
  from vertical of 60° × (offset), where offset is (ball x − paddle centre x) / 120, clamped to
  [−1, 1]. The speed is kept. A ball that hits the paddle's side while still going down is not
  saved.
- **Speed**: the current speed is the level's start speed, 720 px/s × 1.1 ^ (loop), where loop
  counts how many times all three levels have been cleared (0 at first), raised by 5% for every
  10 bricks broken so far in this level (compounded), and never above 1200 px/s. A lost life keeps
  it: the next launch uses the same current speed. A new level resets it to that level's start
  speed. A rise that happens mid-flight changes the moving ball's speed at once, keeping its
  direction.
- **Bricks**: 12 columns of 120×40, 8px apart, the wall starting at x 36 and y 96, rows 48px apart.
  Ball and brick: the ball reflects on the axis of the smaller overlap, and at most one brick is hit
  per physics step.
- **Points**: red 50, orange 40, yellow 30, green 20, blue 10, silver 100 (scored when it breaks).
- **Physics** runs in fixed steps of 1/240 s, with at most 50 ms of game time per animation frame,
  so the ball never passes through a brick or the paddle.
- **Lives**: 3. Losing the ball takes one and goes to Serve. Losing the last one ends the game and
  shows Game over.
- **Best score**: saved in `localStorage` under `breakout.best` (try/catch: without storage the game
  still runs and shows "—"). Saved when a game ends on Game over with a higher score.

### Levels

Written in `js/levels.js` as rows of 12 characters: `R O Y G B` for the colours, `S` for silver,
`.` for empty.

Level 1 (5 rows): `RRRRRRRRRRRR`, `OOOOOOOOOOOO`, `YYYYYYYYYYYY`, `GGGGGGGGGGGG`, `BBBBBBBBBBBB`.

Level 2 (6 rows): `R.R.R.R.R.R.`, `.O.O.O.O.O.O`, `Y.Y.Y.Y.Y.Y.`, `.G.G.G.G.G.G`, `B.B.B.B.B.B.`,
`.B.B.B.B.B.B`.

Level 3 (6 rows): `SSSSSSSSSSSS`, `.RRRRRRRRRR.`, `..OOOOOOOO..`, `...YYYYYY...`, `....GGGG....`,
`.....BB.....`.

After level 3, level 1 comes again with the loop count one higher.

## Sound

Short tones made with Web Audio, no files: paddle hit (square, 440 Hz, 60 ms), brick hit (square,
660 Hz, 50 ms), wall (square, 330 Hz, 40 ms), ball lost (sawtooth falling from 400 to 100 Hz,
400 ms), level clear (three rising notes, 523, 659, 784 Hz, 120 ms each), game over (two falling
notes, 392 then 262 Hz, 250 ms each). Peak gain 0.2, with a 5 ms attack and release so nothing
clicks. The `AudioContext` is created and resumed on the first key press. M toggles sound on and
off at any time, saved in `localStorage` under `breakout.sound`; when it is off, a small "Sound off"
(28px) shows in the HUD's row beside the score. Without Web Audio the game runs silently.

## Code shape

- Pure logic with no DOM, each loadable from Node: `js/levels.js` (the layouts and parsing),
  `js/physics.js` (one fixed step: paddle, ball, walls, bricks, returning events such as
  `"brick"`, `"paddle"`, `"wall"`, `"lost"`, `"cleared"`), `js/hold.js` (the held-keys model of
  Input), `js/score.js` (points, speed rule, best score).
- DOM and devices: `js/keys.js` (key codes to actions), `js/sound.js`, `js/render.js` (canvas),
  `js/screens.js` and the dialogs, `js/game.js` (the loop with `requestAnimationFrame`, which runs
  only while Play is shown and not paused), `js/app.js` (the namespace, already there).
- `BO.game.snapshot()` returns `{ screen, state, score, lives, level, loop, paddleX, ball: {x, y,
  vx, vy}, bricksLeft }` for the drives.
- CSS in `css/app.css` and more files as needed. No file over 200 lines.
- `index.html` keeps `#title-name` and `#build-stamp`. `tests/drive/shell.drive.js` may be changed
  only if a later screen hides what it checks.

## Acceptance tests

1. `npm run check` passes: the compatibility lint, the unit tests and every drive.
2. Unit tests of `js/levels.js`: each level parses to the brick count and positions written above
   (60, 36 and 42 bricks), with silver bricks needing two hits.
3. Unit tests of `js/physics.js`: wall reflections on left, right and top; the paddle bounce angle
   at offsets −1, 0, 0.5 and 1 (−60°, 0°, 30°, 60° from vertical) with speed kept; a ball past the
   bottom gives `"lost"`; a brick hit removes the brick, reflects the ball and scores its points; a
   silver brick needs two hits; one brick per step at most; a ball at 1200 px/s aimed at a brick
   never passes through it; the last brick gives `"cleared"`.
4. Unit tests of `js/hold.js`: keydown/keyup start and end a move; auto-repeat changes nothing; the
   last-pressed direction wins and releasing it falls back to the other; before any keyup is seen a
   move ends 600 ms after its last keydown, and after one is seen it does not.
5. Unit tests of `js/score.js`: points per colour, the 5% rise per 10 bricks with its cap, the
   per-loop starting speed, and best score saved only when higher.
6. A drive at 1920×1080 with Playwright's clock (`page.clock.install()`, `page.clock.runFor`) and
   synthetic keys with forced `keyCode`:
   - The title shows the name, the start line, "Best score: —" and the three control lines.
   - Enter starts a game: HUD "Score 0", "Level 1", three lives; the ball sits on the paddle.
   - Holding Right (keydown, 250 ms, keyup) moves the paddle right by about 410px ± 10px, and it stays put
     after the keyup. The same with D, then Left and A move it back.
   - The same with only keydowns (no keyup ever sent) moves it, and it stops within 600 ms.
   - Space launches; 2 s later the ball has moved and the score or ball position has changed.
   - P opens the pause dialog and the snapshot does not change over 1 s; P resumes. Back opens it
     too; "Quit to title" returns to the title.
   - With the paddle kept far from the ball, the ball is lost: lives drop to 2 and the state is
     Serve. After the last life, Game over shows with the score; "Play again" starts a new game.
   - A game seeded through `BO.game` with one brick left: breaking it shows "Level 2" and then the
     level 2 wall in Serve.
   - Back on the title opens "Leave Breakout?" with Stay focused; Back closes it.
   - The keys the game handles have their default prevented, and the console shows no errors.
7. A layout drive: on the title, play, pause, game over and both dialogs, all visible text is at
   least 28px and every text and choice is at least 48px from every screen edge.
8. A drive with Web Audio replaced by a recording shim: a paddle hit, a brick hit and a lost ball
   each start one tone; after M, none do and "Sound off" shows; the setting survives a reload.

## Out of scope

- Mouse, touch, gamepads, power-ups, multiple balls, a high-score table, or any level beyond the
  three above.
- Packaging, signing or installing on the TV, and testing on the real TV: the owner does that after
  the merge.
- Any change to the tooling in `tools/`, the lint and its tests, `.github/`, `website/` or
  `profile-tizen.md`.
