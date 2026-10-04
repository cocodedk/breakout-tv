# Thinner bricks and a gold core behind the wall

## Goal

Today a level ends when the last brick falls. This changes the goal: a gold core slides left and
right behind the wall, above the bricks. The player tunnels through the wall, and when the ball
touches the core, the rest of the wall dissolves and the player goes on to the next level. The
bricks get half as tall and each level twice as many rows, so the wall is made of thin layers that
the ball cuts through. With the row spacing below the walls get somewhat deeper than before (level
1: 272px instead of 232px; levels 2 and 3: 328px instead of 280px); the numbers in The wall are what
counts.

This builds on spec 01 (`docs/lean/01-breakout.md`) and the code it produced. Everything in spec
01 still holds unless this spec says otherwise.

## The design to match

Spec 01's look: the navy stage `#070b1e`, the brick colours, white ball and paddle. The core is
gold: a disc of radius 28 filled `#ffd447`, with an inner disc of radius 14 in `#fff1b0`, and a glow
drawn as one disc of radius 44 in `rgba(255, 212, 71, 0.25)` behind it. No `shadowBlur`, no
gradients and no images: plain filled circles, so the TV draws it as cheaply as the ball.

## The wall

- Bricks are 120×20 (was 120×40), 12 columns as before, 128px apart (unchanged), rows 28px apart
  (was 48), the wall's top row at y 120 (was 96). Corners keep the 6px radius.
- Every row of the three layouts in spec 01 is doubled: each line appears twice, one under the
  other, in `js/levels.js`. So level 1 has 10 rows and 120 bricks, level 2 has 12 rows and 72
  bricks, level 3 has 12 rows and 84 bricks (24 of them silver).
- Points per brick are unchanged.

## The core

- It lives in the strip above the wall: its centre at y 60, so it spans y 32 to 88 and the wall
  starts 32px below it.
- It slides at 240 px/s between centre x 60 and centre x 1540, turning back at each end. At the
  start of every level it is at x 800 moving right.
- It moves in Serve and Moving, and stands still while a dialog is open, during the dissolve and
  during the level banner. A lost ball does not reset it.
- When the ball's circle touches the core's disc (radius 28; the glow does not count), that is a
  hit: 500 points, the `core` tone plays, the ball disappears and the dissolve starts. The ball does
  not bounce off the core.
- The level does not end when every brick is gone: only a hit on the core ends it. With no bricks
  left, the ball simply flies until it reaches the core.

## The dissolve and the next level

1. **Dissolve** (a new Play sub-state, `"dissolve"`, 1.0 s). The ball is hidden. Every brick still
   standing fades from full to no opacity and shrinks to no height about its own centre line, all
   together, linearly over 1.0 s. The core stays drawn where it was hit. Dissolved bricks score
   nothing.
2. Then the **level banner** of spec 01: "Level N" for 1.5 s, with the playfield empty except the
   paddle and the core.
3. Then the next level's wall in Serve, the core back at x 800 moving right, the speed at the new
   level's start speed, as in spec 01.

During the dissolve, keys act as during the banner: Back and P open the pause dialog, M toggles
sound, and the others do nothing. Pausing freezes the dissolve where it is.

## Speed

Spec 01 raises the ball's speed 5% for every 10 bricks broken in a level. With twice the bricks, it
is now 5% for every **20** bricks broken, compounded, still capped at 1200 px/s. Everything else
about speed is as in spec 01.

## Sound

A new tone, `core`: a sine sweep rising from 300 to 1200 Hz over 500 ms, peak gain 0.2, with the
same 5 ms attack and release as the others. It follows the M switch like every other tone. The
`cleared` tone of spec 01 (three rising notes) now plays when the dissolve ends and the banner
shows.

## The title

A fourth line under the three control lines, 32px, same style: "Goal: break through and hit the
gold core". Every text rule of spec 01 (28px floor, 48px from the edges) still holds.

## Code shape

- `js/physics.js`: the brick size changes and the core. `step` moves the core (when the state lets
  it move) and checks the ball against it after the bricks; a hit adds the event `"core"`. The
  event `"cleared"` goes away: emptying the wall is no longer an event.
- `js/levels.js`: the doubled layouts and the new sizes.
- `js/score.js`: the core's 500 points and the speed rule per 20 bricks.
- `js/game.js` and `js/render.js`: the dissolve state, drawing the core and the fading bricks.
  If a file would pass 200 lines, put the core's motion and drawing in their own files
  (`js/core.js`, `js/render-core.js`).
- `BO.game.snapshot()` adds `core: { x, y, dir }` (dir is 1 moving right, −1 moving left) and
  `state` can be `"dissolve"`. `BO.game.seed()` accepts `core: { x, dir }`.

## Which earlier tests may change

Tests written for spec 01 that assume the old brick size, the old row positions or brick counts,
the `"cleared"` event, a level ending on its last brick, or the speed rise per 10 bricks are
updated to this spec. Every other test from spec 01 keeps what it demands.

## Acceptance tests

1. `npm run check` passes: the compatibility lint, the unit tests and every drive.
2. Unit tests of `js/levels.js`: bricks are 120×20, rows 28px apart from y 120; level 1 has 120
   bricks in 10 rows, level 2 has 72 in 12 rows, level 3 has 84 in 12 rows with 24 silver, and each
   layout line appears twice in a row.
3. Unit tests of `js/physics.js`: the core moves 240 px/s and turns back at 60 and 1540; it starts
   at 800 moving right; a ball touching its disc gives `"core"` and is not reflected; a ball that
   only reaches the glow (between radius 28 and 44) gives nothing; breaking the last brick gives no
   level-ending event; a ball at 1200 px/s aimed at a 20px brick never passes through it; at most
   one brick per step still holds.
4. Unit tests of `js/score.js`: 500 points for the core; the speed rises 5% per 20 bricks,
   compounded, capped at 1200.
5. A drive at 1920×1080 with Playwright's clock:
   - In Moving, the core's x changes by 240 ± 5 px over 1 s, and it turns at an end.
   - With the pause dialog open, the core does not move.
   - Seeding a level with the ball flying straight at the core: the state becomes `"dissolve"`,
     the score rises by 500, after 1.0 s no bricks are left, then "Level 2" shows, and then level 2's
     wall (72 bricks) is in Serve with the core at x 800 moving right.
   - Seeding a level with every brick gone and the ball flying away from the core: the level does
     not end until the ball reaches the core.
   - The title shows the goal line.
6. The sound drive with its recording shim: a core hit starts the `core` tone once, and with sound
   off (M) it starts nothing.
7. The layout drive's rules hold on every screen, including the title with its new line, and the
   console shows no errors.

## Out of scope

- Power-ups, more than one core, cores that shoot back, or new levels beyond the three doubled
  layouts.
- Any change to the controls, the dialogs, the HUD layout or the best-score rules.
- Packaging, signing or installing on the TV, and `website/`, `.github/`, `tools/` and
  `profile-tizen.md`.
