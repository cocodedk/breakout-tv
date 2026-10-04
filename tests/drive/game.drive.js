/* Breakout drive: the title, starting a game, holding keys to move the paddle, launching, pausing. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;
var near = h.near;

async function paddle(page) { return (await h.snap(page)).paddleX; }

/* Holds a key for 250 ms and checks the paddle moved by about 410px (it speeds up from 900 px/s to
   2400 px/s over that time), and stays put afterwards. */
async function holdAndCheck(page, code, delta) {
  var before = await paddle(page);
  await h.hold(page, code, 250);
  var after = await paddle(page);
  near(after - before, delta, 10, "paddle move for key " + code);
  await page.clock.runFor(500);
  assert.strictEqual(await paddle(page), after, "the paddle stays put after keyup");
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  // The no-keyup remote runs first: no keyup may have been seen yet.
  var remote = await h.openPage(context, url);
  await h.down(remote, K.ENTER);
  await remote.clock.runFor(50);
  await h.down(remote, K.RIGHT);
  await remote.clock.runFor(200);
  near((await paddle(remote)) - 680, 280, 20, "200 ms into a keydown with no keyup (up to a frame behind)");
  await remote.clock.runFor(1000);
  var stopped = await paddle(remote);
  assert.strictEqual(stopped, 1360, "it moved to the right edge");
  await h.down(remote, K.LEFT);
  await remote.clock.runFor(1000);
  near(await paddle(remote), 1360 - 1249, 12, "a held direction ends 600 ms after its last keydown");
  var parked = await paddle(remote);
  await remote.clock.runFor(1000);
  assert.strictEqual(await paddle(remote), parked, "and it stays stopped");
  assert.deepStrictEqual(remote.errors, []);

  // Any keyup, even of Enter, ends the 600 ms rule: the move now lasts until released or the edge.
  var keyed = await h.openPage(context, url);
  await h.startGame(keyed);
  await h.down(keyed, K.RIGHT);
  await keyed.clock.runFor(1000);
  await h.down(keyed, K.LEFT);
  await keyed.clock.runFor(1500);
  assert.strictEqual(await paddle(keyed), 0, "no timeout once a keyup has been seen");

  var page = await h.openPage(context, url);
  assert.strictEqual(await h.text(page, "#title-name"), "Breakout");
  assert.strictEqual(await h.text(page, "#title-start"), "Press Enter or OK to start");
  assert.strictEqual(await h.text(page, "#title-best"), "Best score: —");
  var controls = await page.$$eval(".control", function (nodes) {
    return nodes.map(function (n) { return n.textContent; });
  });
  assert.deepStrictEqual(controls, [
    "Move: ← → or A D", "Launch: Space, Enter or OK", "Pause: P or Back",
    "Goal: break through and hit the UFO", "Level: ← → or A D"
  ]);

  await h.startGame(page);
  var first = await h.snap(page);
  assert.strictEqual(first.screen, "play");
  assert.strictEqual(first.state, "serve");
  assert.strictEqual(first.score, 0);
  assert.strictEqual(first.lives, 10);
  assert.strictEqual(first.level, 1);
  assert.strictEqual(first.paddleX, 680);
  assert.strictEqual(first.ball.x, first.paddleX + 120, "the ball sits on the paddle");
  assert.strictEqual(await h.text(page, "#hud-score"), "Score 0");
  assert.strictEqual(await h.text(page, "#hud-level"), "Level 1");
  assert.strictEqual(await h.text(page, "#hud-lives"), "Lives 10");
  assert.ok(await page.isVisible("#play-hint"), "the launch hint shows in Serve");

  await holdAndCheck(page, K.RIGHT, 410);
  await holdAndCheck(page, K.LEFT, -410);
  await holdAndCheck(page, K.D, 410);
  await holdAndCheck(page, K.A, -410);

  await h.tap(page, K.SPACE);
  var before = await h.snap(page);
  assert.strictEqual(before.state, "moving");
  assert.ok(!(await page.isVisible("#play-hint")), "the hint goes away once the ball flies");
  await page.clock.runFor(2000);
  var after = await h.snap(page);
  assert.ok(after.score !== before.score || after.ball.x !== before.ball.x || after.ball.y !== before.ball.y,
    "the ball moved: the score or its position changed");
  await h.seed(page, { ball: { x: 300, y: 600, vx: 0, vy: -100 } });

  await h.tap(page, K.P);
  assert.ok(await page.isVisible("#dialog-pause"));
  assert.strictEqual(await page.getAttribute("#pause-resume", "class"), "choice focused");
  var paused = await h.snap(page);
  await page.clock.runFor(1000);
  assert.deepStrictEqual(await h.snap(page), paused, "nothing moves under the pause dialog");
  await h.tap(page, K.P);
  assert.ok(!(await page.isVisible("#dialog-pause")));
  await page.clock.runFor(200);
  assert.notDeepStrictEqual(await h.snap(page), paused, "the game runs again after P");

  await h.tap(page, K.BACK);
  assert.ok(await page.isVisible("#dialog-pause"), "Back opens it too");
  await h.tap(page, K.DOWN);
  assert.strictEqual(await page.getAttribute("#pause-quit", "class"), "choice focused");
  await h.tap(page, K.ENTER);
  assert.strictEqual((await h.snap(page)).screen, "title", "Quit to title returns to the title");
  assert.strictEqual(await h.text(page, "#title-best"), "Best score: —", "quitting saves no best score");

  assert.deepStrictEqual(page.errors, []);
  assert.ok(page.prevented.every(function (k) { return k.prevented; }), "every handled key had its default prevented");
  console.log("game drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
