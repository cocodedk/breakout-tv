# Level 4: the station slides, and a returned bolt cuts through the wall

## Goal

On level 4 (spec 07), a bolt the paddle bats back turns gold and flies up towards the station. Today
it passes through the bricks without touching them. With this change a gold bolt cuts a path
through the wall: every brick it touches on its way is destroyed. Batting bolts back becomes a way
to tunnel to the station, not only a way to score. The station also stops standing still: it
slides slowly left and right, like the UFO on the other levels, so both the ball and a returned bolt
have to be aimed.

This builds on specs 01 to 08 and the code they produced. Everything in them still holds unless
this spec says otherwise.

## The rule

- A **gold** bolt (`back` true) destroys every brick it touches, at once and whatever its colour:
  a silver brick is destroyed outright too, even with two hits left. "Touches" means the bolt's
  6×28 box overlaps the brick's box, the same box spec 07 uses against the paddle.
- The bolt is not slowed, turned or stopped by bricks: it keeps its speed and direction, so it can
  destroy several bricks in one flight, and still scores 1000 if it then reaches the station.
- Each brick a bolt destroys scores that brick's normal points (spec 01 and spec 07, silver 100)
  and counts as broken for the speed rule (5% for every 20 bricks, spec 02), exactly as if the ball
  had broken it.
- **Green** bolts still pass through bricks without touching them, as spec 07 says.
- If a bolt destroys the last bricks of the wall, nothing special happens: the level still ends
  only when the ball hits the station.
- Bolts only exist on level 4, so levels 1 to 3 are unchanged.

## The station slides

- The station's centre slides at 80 px/s between x 160 and x 1440, turning back the moment it reaches
  an end, like the UFO (spec 02). At the start of level 4 (and on a retry of it) it is at x 800
  moving right. Its y (140) and radius (100) do not change.
- It moves in Serve and Moving, and stands still under a dialog, during the dissolve and during the
  banner, exactly when the UFO moves and stands still. A lost ball does not reset it.
- Everything that belongs to the station moves with it: the whole drawing (hull, shading, trench,
  panels, rim light, dish and the charging glow keep their places relative to the centre), the dish
  from which bolts leave (40 px right of and 40 px above the centre, so (840, 100) when the centre
  is at 800), the ball's hit test and the gold bolt's 100 px hit test. A bolt already in the air
  keeps its own path; it does not follow the station.
- `BO.game.snapshot()`'s `station` adds `dir` (1 moving right, -1 moving left) next to its `x`, and
  `BO.game.seed()` accepts `station: { x, dir }` on level 4.

## Sound

A new tone, `cut`: a square wave falling from 520 to 260 Hz over 0.05 s, peak gain 0.1, with the
5 ms attack and release of the others, following the M switch. It plays once per brick destroyed
by a bolt. When a bolt destroys several bricks in the same physics step, `cut` plays once for that
step.

## Code shape

- `js/station.js`: the bolt-against-bricks test in the bolt movement, adding an event (for example
  `"cut"`) that the game reacts to like a brick break (points are added in physics as for the ball;
  the speed rule and the tone follow the event).
- `js/game.js` is at 198 lines and `js/physics.js` at 194: keep any new code in `js/station.js` (or
  a new small file), and if `game.js` needs a line or two more, move something out of it first.
- No file over 200 lines.

## Which earlier tests may change

Spec 07's test "a bolt passes through bricks" is updated: it now holds for green bolts only. Tests
from specs 07 and 08 that assume the station stands still at x 800 (its drawing at fixed points, the
dish at (840, 100), pixels read at fixed screen points) are updated to the sliding station, for
example by seeding it at x 800 or reading its position from the snapshot. Every other earlier test
keeps what it demands.

## Acceptance tests

1. `npm run check` passes: the compatibility lint, the unit tests and every drive.
2. Unit tests of `js/station.js`:
   - the station starts at x 800 moving right, moves 80 px in 1 s, turns back at 1440 and at 160,
     and does not move in a step that the game does not run (dialog, dissolve, banner);
   - a bolt fired with the station's centre at 500 leaves from (540, 100);
   - the ball hits the station where the station is now, and misses where it was before;
   - a gold bolt flying up through a column of three bricks (one red, one silver with two hits,
     one light grey) destroys all three, keeps its exact speed and direction, and the score rises by
     50 + 100 + 30;
   - the destroyed bricks count as broken (the state's `broken` rises by 3);
   - a green bolt flying through the same column leaves all three standing and scores nothing;
   - a gold bolt that has cut through bricks and then reaches the station still scores 1000;
   - a gold bolt that only passes beside a brick (boxes not overlapping) leaves it standing.
3. A drive at 1920×1080 with Playwright's clock: on level 4 in Moving, the station's x changes by
   80 ± 3 px over 1 s and stays put while the pause dialog is open; then, seed a gold bolt below the wall flying
   straight up under a column of bricks; after it has passed, that column's bricks in its path are
   gone, the score has risen by their points, the ball's speed follows the speed rule, and the level
   is still being played (not ended). The sound shim shows `cut` played; with sound off (M), not.
4. The layout drive's rules hold, and the console shows no errors.

## Out of scope

- Green bolts breaking bricks, bolts on other levels, the station taking damage, or any change to
  how bolts are fired, batted back or aimed (other than leaving from where the dish now is).
- The station moving up or down, changing speed, or following the paddle.
- Packaging, signing or installing on the TV, and `website/`, `.github/`, `tools/` and
  `profile-tizen.md`.
