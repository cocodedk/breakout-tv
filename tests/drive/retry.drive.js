/* Breakout drive: on Game over, retrying the lost level, starting over, and the best score. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

var CHOICE_IDS = ["#over-retry", "#over-again", "#over-title"];

/* Seeds the game, then lets the ball fall out of the last life, which shows Game over. */
async function loseOn(page, patch) {
  await h.seed(page, Object.assign({ lives: 1, ball: { x: 100, y: 600, vx: 0, vy: 720 } }, patch));
  await page.clock.runFor(1000);
  assert.strictEqual((await h.snap(page)).screen, "over");
}

async function focusedChoice(page) {
  for (var i = 0; i < CHOICE_IDS.length; i++) {
    if ((await page.getAttribute(CHOICE_IDS[i], "class")).indexOf("focused") >= 0) { return CHOICE_IDS[i]; }
  }
  return null;
}

/* Launches the ball and returns its speed after one frame. */
async function launchSpeed(page) {
  await h.tap(page, K.SPACE);
  await page.clock.runFor(16);
  var v = (await h.snap(page)).ball;
  return Math.sqrt(v.vx * v.vx + v.vy * v.vy);
}

async function checkRetry(page, loop, speed) {
  await loseOn(page, { level: 2, loop: loop, levelStartScore: 1000, score: 1500 });
  assert.strictEqual(await h.text(page, "#over-retry"), "Retry level 2");
  await h.tap(page, K.ENTER);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.screen, snap.state, snap.level, snap.loop, snap.bricksLeft, snap.lives, snap.score],
    ["play", "serve", 2, loop, 72, 3, 1000], "retry loop " + loop);
  assert.deepStrictEqual([snap.core.x, snap.core.dir], [800, 1], "the core starts at x 800 moving right");
  assert.strictEqual(snap.levelStartScore, 1000, "the retry started from the same score");
  h.near(await launchSpeed(page), speed, 1, "start speed of loop " + loop);
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  var page = await h.openPage(context, url);
  await h.startGame(page);

  await loseOn(page, { level: 2, levelStartScore: 1000, score: 1500 });
  assert.deepStrictEqual(await page.locator("#screen-over .choice").allTextContents(),
    ["Retry level 2", "Start over", "Title"]);
  assert.strictEqual(await focusedChoice(page), "#over-retry");

  await checkRetry(page, 0, 720);
  await checkRetry(page, 1, 792);

  await loseOn(page, { level: 2, loop: 1, levelStartScore: 1000, score: 1500 });
  await h.tap(page, K.RIGHT);
  assert.strictEqual(await focusedChoice(page), "#over-again");
  await h.tap(page, K.ENTER);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.screen, snap.state, snap.level, snap.loop, snap.score, snap.lives],
    ["play", "serve", 1, 0, 0, 3], "Start over");

  await loseOn(page, { score: 300 });
  assert.strictEqual(await h.text(page, "#over-retry"), "Retry level 1");
  await h.tap(page, K.ENTER);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.level, snap.score, snap.lives], [1, 0, 3], "retrying level 1 of a new game");

  await loseOn(page, { level: 3, levelStartScore: 700, score: 900 });
  await h.tap(page, K.RIGHT);
  await h.tap(page, K.RIGHT);
  await h.tap(page, K.RIGHT);
  assert.strictEqual(await focusedChoice(page), "#over-title", "the focus stops at the last choice");
  await h.tap(page, K.ENTER);
  assert.strictEqual((await h.snap(page)).screen, "title");

  await h.startGame(page);
  await loseOn(page, { score: 100 });
  await h.tap(page, K.BACK);
  assert.strictEqual((await h.snap(page)).screen, "title", "Back goes to the title");

  // The level a banner leads to records the score it begins with.
  await h.startGame(page);
  await h.seed(page, Object.assign({ score: 400 }, h.atCore()));
  await page.clock.runFor(2800);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.level, snap.levelStartScore], ["serve", 2, snap.score]);
  assert.ok(snap.score >= 400);

  // The best score is saved at Game over; a retry leaves it, and a lower score later keeps it.
  await loseOn(page, { score: 5000 });
  assert.ok(await page.isVisible("#over-new-best"));
  assert.strictEqual(await h.text(page, "#over-best"), "Best score 5000");
  await h.tap(page, K.ENTER);
  await loseOn(page, { score: 20 });
  assert.ok(!(await page.isVisible("#over-new-best")));
  assert.strictEqual(await h.text(page, "#over-best"), "Best score 5000", "a lower score keeps the best");
  await h.tap(page, K.BACK);
  assert.strictEqual(await h.text(page, "#title-best"), "Best score: 5000");

  assert.deepStrictEqual(page.errors, []);
  console.log("retry drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
