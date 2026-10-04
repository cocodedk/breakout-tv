# Level 4: the battle station

## Goal

A fourth level with a boss. Instead of the UFO, a grey, moon-sized battle station hangs behind a
grey wall. It fires bolts at the paddle. The paddle can bat a bolt back, and a returned bolt that
hits the station scores 1000 points. As with the UFO, the ball hitting the station ends the level:
the wall dissolves, the lives multiply the score, and the game goes on. After level 4 the game
repeats from level 1, faster, as it does after level 3 today.

The station is inspired by a famous science-fiction battle station, but it is our own drawing and
is never named after anything: on screen and in the code it is "the station". Nothing in the game,
the code or the tests uses a film's name.

This builds on specs 01 to 06 and the code they produced. Everything in them still holds unless
this spec says otherwise. On level 4 there is no UFO.

## The design to match

The game's look: flat fills on the deep-space sky, the brick style of spec 02, no images, no
`shadowBlur`, no gradients, no `filter`. Greys: hull `#8a93a6`, dark panels `#5b6378`, trench
`#3b4152`, dish inner `#6f788c`. Bolts are `#4be38e` (green) going down and `#ffd447` (gold) once
returned.

## The level

- `js/levels.js` gains a fourth layout, doubled like the others (spec 02), its rows starting at
  y 260 (lower than the other levels, to leave room for the station) and 28px apart:
  `LLLLLLLLLLLL`, `DDDDDDDDDDDD`, `LL.LL..LL.LL`, `SSSSSSSSSSSS`, `DDDDDDDDDDDD`, `LLLLLLLLLLLL`.
  So 12 rows and 136 bricks (24 silver): the third line has 8 bricks, the others 12.
- Two new brick colours: `L` light grey `#9aa3b5` worth 30, and `D` dark grey `#5b6378` worth 20.
  Silver `S` is as before.
- `COUNT` becomes 4: after level 4 comes level 1 with the loop count one higher (spec 01's rule,
  now after 4 levels instead of 3). Retry (spec 03) works on level 4 like any level.
- Level 4's banner says "Level 4", like the others.

## The station

- A disc of radius 100, centred (800, 140), still (it does not slide). Drawn on the playfield canvas
  each frame, behind the bricks, with plain fills and one clip to the disc:
  1. the hull disc `#8a93a6`;
  2. the lower half a shade darker: the disc's lower half filled `rgba(0, 0, 0, 0.18)`;
  3. the trench: a 10px band `#3b4152` across the whole disc, its centre on the equator (y 140);
  4. three thin panel lines (2px, `#5b6378`) across the disc at y 95, 185 and 215;
  5. the dish: a disc of radius 26 `#5b6378` centred (840, 100), with an inner disc of radius 14
     `#6f788c`;
  6. while charging (the 0.5 s before each shot), a green dot of radius 6 `#4be38e` at the dish's
     centre.
- The ball hits the station when its circle touches the station's disc (radius 100). That is a hit
  like a UFO hit: 500 points, then the lives multiply the score (spec 05), the UFO-hit sound
  layers (spec 06), the dissolve, the banner and the next level. The ball does not bounce off it.
- Bricks are not tested against the station: the station is behind the wall.

## Bolts

- The station fires only while the state is Moving. The first shot comes 2.0 s after the ball is
  launched (or relaunched after a lost ball), then one every 3.0 s while Moving lasts. The timer
  stops in Serve, during the dissolve and the banner, and under the pause dialog. At most 2 bolts
  are in the air; a shot due while 2 are flying is skipped and the timer goes on.
- A bolt is a 6×28 rounded bar (radius 3), drawn along its direction of travel. It leaves the
  dish's centre (840, 100) at 600 px/s, aimed at the point where the paddle's centre is at the
  moment of firing, at the paddle's top (y 816).
- Bolts pass through bricks, the ball and the UFO (there is none on this level) without touching
  them; nothing but the paddle and the station stops a bolt.
- **Batting it back**: when a green bolt touches the paddle (its 6×28 box overlaps the paddle's
  box), it turns gold and leaves upward at 900 px/s, at the angle the ball would leave at the
  same point of the paddle (spec 01's rule: 60° × offset from vertical). It plays the `reflect`
  tone.
- **Hitting the station**: a gold bolt whose centre comes within 100px of the station's centre is
  removed, scores 1000 points and plays the `station-hit` tone. Green bolts never hurt the
  station.
- A bolt that leaves the playfield (any edge) is removed. A green bolt that gets past the paddle
  does nothing else: no life lost, no penalty.
- When the level ends (the ball hits the station), every bolt is removed at once. A lost ball does
  not remove bolts: in Serve the bolts already flying keep moving, can still be batted back and can
  still score; only the firing timer waits for the next launch.

## Sounds

Following spec 01's tones (5 ms attack and release, the M switch):

- `fire`: square wave 880 → 440 Hz, 0.12 s, peak 0.12.
- `reflect`: square wave 660 → 1320 Hz, 0.08 s, peak 0.15.
- `station-hit`: white noise (the UFO's noise buffer) through a low-pass filter falling from 3000 to
  300 Hz over 0.2 s, peak 0.2, together with a sine 200 → 80 Hz, 0.25 s, peak 0.2.

## The title

Unchanged: the goal line still reads "Goal: break through and hit the UFO", which is true for
levels 1 to 3, and the earlier tests of the title keep what they demand. Level 4 is a surprise.

## Code shape

- `js/game.js` (197 lines) and `js/physics.js` (186 lines) are near the 200-line limit: put the
  station, its timer and the bolts in new files, for example `js/station.js` (pure, no DOM, loadable
  from Node: the disc test, firing, aiming, bolt motion, batting back, hits) and
  `js/render-station.js` (drawing the station and the bolts), and move code out of `game.js` or
  `physics.js` where needed. Level 4 sets the target to the station instead of the UFO; levels 1
  to 3 keep the UFO.
- `BO.game.snapshot()` adds `station` (`null` on levels 1 to 3, otherwise `{ x, y, r, charging }`)
  and `bolts` (a list of `{ x, y, vx, vy, back }`, `back` true once returned). `BO.game.seed()`
  accepts `bolts` and `fireIn` (seconds until the next shot).
- No file over 200 lines.

## Which earlier tests may change

Tests that assume three levels (for example the level after level 3 being level 1), or the brick
colours and points being only `R O Y G B S`, are updated to this spec. Every other earlier test
keeps what it demands.

## Acceptance tests

1. `npm run check` passes: the compatibility lint, the unit tests and every drive.
2. Unit tests of `js/levels.js`: level 4 has 136 bricks in 12 rows from y 260, 24 silver; `L` is
   worth 30 and `D` 20; `COUNT` is 4.
3. Unit tests of `js/station.js`: the first shot 2.0 s after launch and then every 3.0 s; no shot
   outside Moving; a shot skipped while 2 bolts fly; a new bolt leaves (840, 100) at 600 px/s aimed
   at the paddle's centre at y 816; a bolt passes through bricks; a green bolt meeting the paddle
   turns gold and leaves at 900 px/s at the ball's angle for that paddle point (offsets −1, 0 and 1
   give −60°, 0° and 60°); a gold bolt within 100px of the station's centre scores 1000 and is
   removed; a green bolt there does nothing; a bolt past any edge is removed; a missed green bolt
   costs nothing; the ball touching the station's disc is a hit.
4. Unit tests of the drawing, with a recording fake context: the station's layers in the order
   above, the charging dot only while charging, bolts green going down and gold coming back.
5. A drive at 1920×1080 with Playwright's clock:
   - Seed level 4: the station is shown, there is no UFO (`snapshot().core` plays no part and
     `station` is set), and the wall has 136 bricks.
   - After launch, the first bolt appears at 2.0 s ± one frame and flies towards the paddle.
   - With the paddle placed under the bolt, the bolt turns back (`back` true) and, aimed from the
     paddle's centre, reaches the station: the score rises by 1000.
   - With the paddle moved away, the bolt leaves the bottom and lives and score are unchanged.
   - The ball sent into the station: the dissolve starts, all bolts are gone, and after the
     banner the next level is level 1 with the loop count one higher.
   - On level 3, hitting the UFO leads to level 4 (not level 1).
   - Pausing on level 4 stops the bolts and the timer; resuming carries on from where they were.
6. The sound drive's shim shows `fire` once per shot, `reflect` once per batted bolt and
   `station-hit` once per returned hit; with sound off (M), none.
7. The layout drive's rules hold on level 4, and the console shows no errors.

## Out of scope

- The station moving, taking damage, having health, or being destroyed by bolts.
- Power-ups, more bosses, or other levels changing.
- Any film name, logo, music or quote.
- Packaging, signing or installing on the TV, and `website/`, `.github/`, `tools/` and
  `profile-tizen.md`.
