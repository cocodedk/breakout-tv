/* Breakout drive: on level 4 the battle station is drawn and fires its first bolt 2 s after the launch;
   the paddle bats the bolt back for 1000 points or lets it fall past; the ball hitting the station ends the
   level and leads to level 1 again; pausing freezes the bolts and the firing timer. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

/* The ball parked at rest far from everything, so only the bolts matter. */
var PARKED = { ball: { x: 100, y: 700, vx: 0, vy: 0 } };

function pixel(page, x, y) {
  return page.evaluate(function (p) {
    var d = document.getElementById("playfield").getContext("2d").getImageData(p.x, p.y, 1, 1).data;
    return [d[0], d[1], d[2], d[3]];
  }, { x: x, y: y });
}

function speedOf(b) {
  return Math.sqrt(b.vx * b.vx + b.vy * b.vy);
}

/* A new game on level 4 (reached by a UFO hit on level 3), in Serve. */
async function onLevel4(context, url) {
  var page = await h.openPage(context, url);
  await h.startGame(page);
  await h.toLevel4(page);
  return page;
}

/* The same, launched, with the ball parked: the station's 2 s count begins. */
async function launched(context, url) {
  var page = await onLevel4(context, url);
  await h.tap(page, K.SPACE);
  await h.seed(page, PARKED);
  return page;
}

async function checkStationShown(page) {
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.level, snap.loop, snap.state, snap.bricksLeft, snap.core, snap.bolts],
    [4, 0, "serve", 136, null, []], "a UFO hit on level 3 leads to level 4, with no UFO and no bolts");
  assert.deepStrictEqual(snap.station, { x: 800, y: 140, r: 100, charging: false });
  assert.deepStrictEqual(await pixel(page, 760, 60), [138, 147, 166, 255], "the hull is drawn");
  var dark = await pixel(page, 850, 210);
  [138, 147, 166].forEach(function (v, i) {
    assert.ok(dark[i] < v * 0.8, "the lower right is in shade: " + dark[i] + " against " + v);
  });
}

/* Seeding level 4 on a fresh game loads its wall and station, and takes the UFO away. */
async function checkSeededLevel(context, url) {
  var page = await h.openPage(context, url);
  await h.startGame(page);
  await h.seed(page, { level: 4 });
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.level, snap.bricksLeft, snap.core, snap.station],
    [4, 136, null, { x: 800, y: 140, r: 100, charging: false }]);
  await h.seed(page, { level: 1 });
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.bricksLeft, snap.station === null, snap.core !== null], [120, true, true]);
  assert.deepStrictEqual(page.errors, []);
  await page.close();
}

async function checkFirstBolt(page) {
  await page.clock.runFor(1000);
  assert.strictEqual((await h.snap(page)).station.charging, false, "not charging at 1 s");
  await page.clock.runFor(700);
  assert.strictEqual((await h.snap(page)).station.charging, true, "charging in the last half second");
  await page.clock.runFor(270);
  assert.deepStrictEqual((await h.snap(page)).bolts, [], "no bolt before 2 s");
  await page.clock.runFor(50);
  var snap = await h.snap(page);
  assert.strictEqual(snap.bolts.length, 1, "the first bolt appears at 2 s");
  var b = snap.bolts[0];
  assert.strictEqual(b.back, false);
  h.near(speedOf(b), 600, 0.01, "bolt speed");
  assert.ok(b.vy > 0 && b.vx < 0, "it flies down and towards the paddle's centre");
  return snap;
}

async function checkBatted(page, before) {
  var turned = null;
  for (var i = 0; i < 30 && !turned; i++) {
    await page.clock.runFor(50);
    var bolts = (await h.snap(page)).bolts;
    if (bolts.length && bolts[0].back) { turned = bolts[0]; }
  }
  assert.ok(turned, "the paddle under the bolt bats it back");
  h.near(speedOf(turned), 900, 0.01, "returned bolt speed");
  assert.ok(turned.vy < 0 && Math.abs(turned.vx) < 30, "it leaves almost straight up from the paddle's middle");
  await page.clock.runFor(1000);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.bolts.length, snap.score - before, snap.lives], [0, 1000, 10],
    "the returned bolt hit the station: 1000 points and no life lost");
}

async function checkMissed(context, url) {
  var page = await launched(context, url);
  await page.clock.runFor(2020);
  var before = await h.snap(page);
  assert.strictEqual(before.bolts.length, 1);
  await h.hold(page, K.LEFT, 700);
  assert.strictEqual((await h.snap(page)).paddleX, 0, "the paddle is out of the way");
  await page.clock.runFor(1200);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.bolts.length, snap.lives, snap.score, snap.state], [0, 10, before.score, "moving"],
    "a bolt that falls past costs nothing");
  assert.deepStrictEqual(page.errors, []);
  await page.close();
}

async function checkStationHit(page) {
  var before = (await h.snap(page)).score;
  await h.seed(page, Object.assign({ bolts: [{ x: 300, y: 300, vx: 0, vy: 50, back: false }] }, h.atStation(h.FAR_BRICKS)));
  await page.clock.runFor(100);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.bolts, snap.score], ["dissolve", [], (before + 500) * 10],
    "the dissolve starts, every bolt is gone and the lives multiply the score");
  await page.clock.runFor(2600);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.level, snap.loop, snap.bricksLeft, snap.station], ["serve", 1, 1, 120, null],
    "after level 4 comes level 1, a loop faster");
}

async function checkPause(context, url) {
  var page = await launched(context, url);
  await page.clock.runFor(1800);
  await h.tap(page, K.P);
  assert.strictEqual((await h.snap(page)).dialog, "pause");
  await page.clock.runFor(5000);
  await h.tap(page, K.P);
  await page.clock.runFor(100);
  assert.deepStrictEqual((await h.snap(page)).bolts, [], "the timer stood still under the pause dialog");
  await page.clock.runFor(150);
  assert.strictEqual((await h.snap(page)).bolts.length, 1, "it carried on with its last 0.2 s");

  await h.tap(page, K.P);
  var frozen = (await h.snap(page)).bolts;
  await page.clock.runFor(3000);
  assert.deepStrictEqual((await h.snap(page)).bolts, frozen, "the bolt hangs still under the pause dialog");
  await h.tap(page, K.P);
  await page.clock.runFor(100);
  h.near((await h.snap(page)).bolts[0].y - frozen[0].y, 60, 25, "it carries on from where it was");
  assert.deepStrictEqual(page.errors, []);
  await page.close();
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  var page = await onLevel4(context, url);
  await checkStationShown(page);
  await h.tap(page, K.SPACE);
  await h.seed(page, PARKED);
  var snap = await checkFirstBolt(page);
  await checkBatted(page, snap.score);
  await checkStationHit(page);
  assert.deepStrictEqual(page.errors, []);
  await page.close();

  await checkSeededLevel(context, url);
  await checkMissed(context, url);
  await checkPause(context, url);
  console.log("station drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
