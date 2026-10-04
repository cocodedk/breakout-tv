/* Breakout drive: the gold core slides at 240 px/s and turns at the ends, stands still under a dialog,
   and a hit on it dissolves the wall, shows the next level's banner and then its wall. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

function near(actual, expected, tolerance, what) {
  assert.ok(Math.abs(actual - expected) <= tolerance, what + ": " + actual + " should be " + expected + " +-" + tolerance);
}

/* A level with two bricks far from the ball, and the ball just below a core that moves into its path. */
var AT_CORE = {
  bricks: [{ col: 0, row: 2, color: "R" }, { col: 11, row: 2, color: "R" }],
  core: { x: 780, dir: 1 },
  ball: { x: 800, y: 110, vx: 0, vy: -720 }
};

/* No bricks, and the ball flying sideways far below the core. */
function adrift(core) {
  return { bricks: [], core: core, ball: { x: 300, y: 500, vx: 720, vy: 0 } };
}

async function coreOf(page) { return (await h.snap(page)).core; }

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  var page = await h.openPage(context, url);
  await h.tap(page, K.ENTER);

  var core = await coreOf(page);
  assert.deepStrictEqual(core, { x: 800, y: 60, dir: 1 }, "the core starts at x 800 moving right");

  // It slides 240 px/s in Moving and turns back at each end.
  await h.seed(page, adrift({ x: 200, dir: 1 }));
  await page.clock.runFor(1000);
  core = await coreOf(page);
  near(core.x - 200, 240, 5, "the core moves 240 px in a second");
  assert.strictEqual(core.dir, 1);

  await h.seed(page, { core: { x: 1500, dir: 1 } });
  await page.clock.runFor(1000);
  core = await coreOf(page);
  near(core.x, 1540 - 200, 5, "it turned at 1540 and came back");
  assert.strictEqual(core.dir, -1);

  await h.seed(page, { core: { x: 100, dir: -1 } });
  await page.clock.runFor(1000);
  core = await coreOf(page);
  near(core.x, 60 + 200, 5, "it turned at 60 and came back");
  assert.strictEqual(core.dir, 1);

  // It stands still under a dialog.
  await h.tap(page, K.P);
  var parked = await coreOf(page);
  await page.clock.runFor(1000);
  assert.deepStrictEqual(await coreOf(page), parked, "the core does not move under the pause dialog");
  await h.tap(page, K.P);

  // With every brick gone, the ball flies on until it reaches the core.
  await h.seed(page, adrift({ x: 800, dir: 1 }));
  await page.clock.runFor(3000);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.level, snap.bricksLeft], ["moving", 1, 0], "no bricks does not end the level");

  // A hit: 500 points, the dissolve, and a pause freezes it.
  await h.seed(page, AT_CORE);
  await page.clock.runFor(100);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.score, snap.bricksLeft], ["dissolve", 500, 2]);
  var hit = snap.core;
  await h.tap(page, K.SPACE);
  assert.strictEqual((await h.snap(page)).state, "dissolve", "keys do nothing during the dissolve");
  await h.tap(page, K.P);
  assert.strictEqual((await h.snap(page)).dialog, "pause", "P opens the pause dialog");
  await page.clock.runFor(2000);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.bricksLeft], ["dissolve", 2], "pausing freezes the dissolve");
  await h.tap(page, K.P);

  // It ends after a second: no bricks left, then the banner, then the next level's wall.
  await page.clock.runFor(1100);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.bricksLeft, snap.score], ["banner", 0, 500], "dissolved bricks score nothing");
  assert.strictEqual(await h.text(page, "#play-banner"), "Level 2");
  assert.deepStrictEqual(snap.core, hit, "the core stays where it was hit");
  await page.clock.runFor(1000);
  assert.deepStrictEqual((await h.snap(page)).core, hit, "and stands still during the banner");
  await page.clock.runFor(600);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.level, snap.bricksLeft], ["serve", 2, 72]);
  assert.strictEqual(snap.core.dir, 1, "the core is moving right again");
  near(snap.core.x, 800, 100, "from x 800, a few frames into Serve");

  assert.deepStrictEqual(page.errors, []);
  assert.ok(page.prevented.every(function (k) { return k.prevented; }), "every handled key had its default prevented");
  console.log("core drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
