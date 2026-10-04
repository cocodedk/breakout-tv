/* Breakout drive: on level 4 the station slides 80 px/s and stands still under the pause dialog; a gold bolt
   flying up through a column of bricks destroys them, scores them, speeds the ball by the speed rule and
   plays `cut`, while the level goes on; with sound off (M) no `cut` plays. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var shim = require("./audio-shim.js");
var K = h.KEY;

/* A ball flying up at x 1000, away from the station at the right and from the column at x 420 to 540. */
var BALL = { x: 1000, y: 400, vx: 0, vy: -720 };

/* A column of 20 yellow bricks (600 points) at x 420 to 540, and a gold bolt flying up under it. */
function cutSeed() {
  var bricks = [];
  for (var row = 0; row < 20; row++) { bricks.push({ col: 3, row: row, color: "Y" }); }
  return { bricks: bricks, station: { x: 1300, dir: 1 }, fireIn: 100, ball: BALL,
    bolts: [{ x: 480, y: 800, vx: 0, vy: -900, back: true }] };
}

function cutTones(page) {
  return page.evaluate(function () {
    return window.__notes.filter(function (n) { return n.freq && n.freq.length === 2 && n.freq[0][1] === 520; });
  });
}

async function checkSlide(page) {
  await h.seed(page, { station: { x: 800, dir: 1 }, fireIn: 100, ball: { x: 100, y: 700, vx: 0, vy: 0 } });
  await page.clock.runFor(1000);
  var moved = (await h.snap(page)).station.x - 800;
  h.near(moved, 80, 3, "the station slides 80 px in 1 s");
  await h.tap(page, K.P);
  var still = (await h.snap(page)).station.x;
  await page.clock.runFor(1000);
  assert.strictEqual((await h.snap(page)).station.x, still, "it stands still under the pause dialog");
  await h.tap(page, K.P);
}

/* A ball hit on the station starts the dissolve and then the banner: the station stands still in both. */
async function checkStandsStill(page) {
  await h.seed(page, Object.assign({ fireIn: 100 }, h.atStation(h.FAR_BRICKS)));
  await page.clock.runFor(100);
  var snap = await h.snap(page);
  assert.strictEqual(snap.state, "dissolve");
  await page.clock.runFor(500);
  assert.strictEqual((await h.snap(page)).station.x, snap.station.x, "still during the dissolve");
  await page.clock.runFor(600);
  snap = await h.snap(page);
  assert.strictEqual(snap.state, "banner");
  await page.clock.runFor(500);
  assert.strictEqual((await h.snap(page)).station.x, snap.station.x, "still during the banner");
}

async function checkCut(page) {
  var before = await h.snap(page);
  await h.seed(page, cutSeed());
  await page.clock.runFor(1000);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.bricksLeft, snap.score - before.score, snap.state, snap.screen],
    [0, 600, "moving", "play"], "the column is gone, scored, and the level goes on");
  assert.deepStrictEqual(snap.bolts, [], "the bolt flew off the top");
  var speed = Math.sqrt(snap.ball.vx * snap.ball.vx + snap.ball.vy * snap.ball.vy);
  h.near(speed, 756, 1, "20 bricks broken raise the speed by 5%");
  var tones = await cutTones(page);
  assert.ok(tones.length >= 1 && tones.length <= 20, "cut played: " + tones.length);
  assert.deepStrictEqual([tones[0].type, tones[0].freq, tones[0].gain],
    ["square", [["set", 520, 0], ["ramp", 260, 0.05]], shim.envelope(0.1, 0, 0.05)]);
  return tones.length;
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript(shim.installShim);
  var page = await h.openPage(context, url);
  await h.startGame(page);
  await h.toLevel4(page);
  await h.tap(page, K.SPACE);
  await checkSlide(page);
  var played = await checkCut(page);

  await h.tap(page, K.M);
  await h.seed(page, cutSeed());
  await page.clock.runFor(1000);
  assert.strictEqual((await h.snap(page)).bricksLeft, 0, "the bolt still cuts with sound off");
  assert.strictEqual((await cutTones(page)).length, played, "but plays no more tones");
  await checkStandsStill(page);
  assert.deepStrictEqual(page.errors, []);
  console.log("station cut drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
