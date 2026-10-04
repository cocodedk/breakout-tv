/* Breakout drive: ten lives a level, and the lives left multiply the score when the UFO is hit. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

/* Lets the ball fall out of the lives the game has, or of one life when lives is given. */
async function loseBall(page, lives) {
  var patch = { ball: { x: 100, y: 600, vx: 0, vy: 720 } };
  if (lives !== undefined) { patch.lives = lives; }
  await h.seed(page, patch);
  await page.clock.runFor(1000);
}

/* Seeds a UFO hit with the given score and lives, and runs until the dissolve has begun. */
async function hitUfo(page, score, lives) {
  await h.seed(page, Object.assign({ score: score, lives: lives }, h.atCore()));
  await page.clock.runFor(100);
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  var page = await h.openPage(context, url);
  await h.startGame(page);

  assert.strictEqual(await h.text(page, "#hud-lives"), "Lives 10");
  assert.strictEqual(await h.text(page, "#hud-score"), "Score 0");
  assert.ok(!(await page.isVisible("#play-bonus")), "no bonus line in Serve");
  await loseBall(page);
  assert.strictEqual(await h.text(page, "#hud-lives"), "Lives 9");

  // The hit adds 500, then multiplies by the lives left; the line shows until the next wall.
  await hitUfo(page, 1000, 7);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.score, snap.lives], ["dissolve", 10500, 7]);
  assert.strictEqual(await h.text(page, "#hud-score"), "Score 10,500");
  assert.ok(await page.isVisible("#play-bonus"));
  assert.strictEqual(await h.text(page, "#play-bonus"), "7 lives left: score × 7");
  await page.clock.runFor(1100);
  assert.strictEqual((await h.snap(page)).state, "banner");
  assert.ok(await page.isVisible("#play-bonus"), "the line stays through the banner");
  await page.clock.runFor(1500);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.level, snap.lives, snap.levelStartScore], ["serve", 2, 10, 10500]);
  assert.ok(!(await page.isVisible("#play-bonus")), "the line goes with the banner");
  assert.strictEqual(await h.text(page, "#hud-lives"), "Lives 10");

  // A retry starts from the multiplied score with full lives.
  await loseBall(page, 1);
  assert.strictEqual((await h.snap(page)).screen, "over");
  assert.strictEqual(await h.text(page, "#over-score"), "Score 10,500");
  assert.strictEqual(await h.text(page, "#over-retry"), "Retry level 2");
  await h.tap(page, K.ENTER);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.level, snap.score, snap.lives], [2, 10500, 10]);

  // Start over gives full lives and no score.
  await loseBall(page, 1);
  await h.tap(page, K.RIGHT);
  await h.tap(page, K.ENTER);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.level, snap.score, snap.lives], [1, 0, 10]);

  // One life left says "1 life left".
  await hitUfo(page, 0, 1);
  assert.strictEqual((await h.snap(page)).score, 500);
  assert.strictEqual(await h.text(page, "#play-bonus"), "1 life left: score × 1");
  await page.clock.runFor(2700);

  // The score stops at 999,999,999,999.
  await hitUfo(page, 600000000000, 10);
  assert.strictEqual((await h.snap(page)).score, 999999999999);
  assert.strictEqual(await h.text(page, "#hud-score"), "Score 999,999,999,999");
  await page.clock.runFor(2700);

  await loseBall(page, 1);
  assert.strictEqual(await h.text(page, "#over-score"), "Score 999,999,999,999");
  assert.strictEqual(await h.text(page, "#over-best"), "Best score 999,999,999,999");
  await h.tap(page, K.BACK);
  assert.strictEqual(await h.text(page, "#title-best"), "Best score: 999,999,999,999");

  assert.deepStrictEqual(page.errors, []);
  console.log("lives drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
