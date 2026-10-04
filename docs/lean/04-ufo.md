# The core becomes a UFO with shifting colours

## Goal

The gold disc behind the wall (spec 02) becomes a flying saucer whose colours shift all the time
through the rainbow, so the target is fun to look at and easy to spot through a gap in the wall.
It moves, scores and ends the level exactly as the core does today: only its look and the shape
the ball must touch change.

This builds on specs 01 to 03 and the code they produced. Everything in them still holds unless
this spec says otherwise. In the code the thing keeps its names (`js/core.js`, `BO.core`, the
`"core"` event, the `core` tone, `snapshot().core`); only what is drawn and its hit shape change.

## The design to match

The game's look: the navy stage `#070b1e`, flat filled shapes, no images, no web fonts. The UFO is
drawn on the playfield canvas with plain fills only: no `shadowBlur`, no gradients, no `filter`, so
the TV draws it as cheaply as the old core.

## The UFO

All positions are playfield pixels; `x` is the core's centre x from spec 02 (it slides between 60
and 1540 at 240 px/s as today).

- **Glow**: an ellipse centred (x, 60), radii 60 × 26, in the hull colour at opacity 0.25, drawn
  first.
- **Hull**: an ellipse centred (x, 64), radii 44 × 12, in the hull colour.
- **Dome**: the top half of a disc centred (x, 56), radius 18, in `rgba(200, 240, 255, 0.85)`,
  drawn on top of the hull, so the dome sits on the saucer.
- **Lights**: five discs of radius 4 along the hull's middle line, at x − 30, x − 15, x, x + 15 and
  x + 30, y 66. Light i (0 to 4) has the hull's hue + 72 × i degrees.

The hull colour is `hsl(hue, 90%, 60%)`. The hue turns a full circle every 4 seconds:
hue = (t / 4000 × 360) mod 360, where t is `performance.now()` in milliseconds at the moment the
frame is drawn. Because the playfield is only drawn while the game loop runs, the colours stand
still under the pause dialog, like everything else. During the dissolve and the banner the UFO is
drawn, and its colours keep shifting.

## Hitting the UFO

The ball (radius 12) hits the UFO when its circle touches the box from x − 44 to x + 44 and from
y 38 to y 76 (the dome's top to the hull's bottom), tested the way bricks are tested: the distance
from the ball's centre to the nearest point of that box is at most 12. The glow does not count.
What a hit does is unchanged from spec 02: 500 points, the `core` tone, the ball disappears, the
wall dissolves, and the banner leads to the next level.

## The title

The goal line reads "Goal: break through and hit the UFO" (it says "the gold core" today).

## Code shape

- `js/core.js`: the hit test becomes the box test above; its comment says it is the UFO. Keep the
  motion as it is.
- `js/render.js` (or a new `js/render-ufo.js` if `render.js` would pass 200 lines): draws the UFO.
  The hue reaches the drawing as part of the view object `hud.refresh` passes to `render.draw`
  (`view.hue`), computed there from `performance.now()`; the drawing itself never reads the clock.
- `index.html`: the goal line's text.
- No file over 200 lines.

## Which earlier tests may change

Tests from spec 02 that assume the core's disc of radius 28 as the hit shape, or that check the
drawing of the gold disc, are updated to this spec. The core's motion, its 500 points, the dissolve
and the banner keep what earlier tests demand.

## Acceptance tests

1. `npm run check` passes: the compatibility lint, the unit tests and every drive.
2. Unit tests of the hit test: a ball whose circle touches the box's left end, right end, top (the
   dome) or bottom (the hull) is a hit; a ball 13px from the box on any side is not; a ball inside
   the glow but off the box is not.
3. Unit tests of the drawing, with a recording fake context: the glow, the hull, the dome and five
   lights are drawn, in that order, at the positions above; with `view.hue` 0 the hull is
   `hsl(0, 90%, 60%)` and light 1 is `hsl(72, 90%, 60%)`; with hue 300, light 2 wraps to
   `hsl(84, 90%, 60%)`.
4. A drive at 1920×1080 with Playwright's clock: in Moving, the hue passed to the drawing changes by
   90 ± 2 degrees over 1 s of clock time; with the pause dialog open, nothing is redrawn; a ball
   seeded to fly up into the UFO's hull at a point 40px left of its centre (outside the old disc of
   radius 28 plus the ball's 12) is a hit, gives 500 points and starts the dissolve.
5. The title shows "Goal: break through and hit the UFO", and the layout drive's rules still hold.
6. The console shows no errors.

## Out of scope

- Any change to the UFO's motion, speed or path, its points, the dissolve, the banner, the sounds
  or the levels.
- A UFO that shoots, beams, or reacts to near misses.
- Packaging, signing or installing on the TV, and `website/`, `.github/`, `tools/` and
  `profile-tizen.md`.
