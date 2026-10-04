/* Breakout drive: on every screen and dialog, all visible text is at least 28px and every text
   and choice sits at least 48px from each screen edge. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

/* Runs in the page: lists every visible text or choice that is too small or too near an edge. */
function measure() {
  var MARGIN = 48;
  var TOLERANCE = 1;
  var problems = [];

  function inside(r) {
    return r.left >= MARGIN - TOLERANCE && r.top >= MARGIN - TOLERANCE &&
      r.right <= 1920 - MARGIN + TOLERANCE && r.bottom <= 1080 - MARGIN + TOLERANCE;
  }

  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var node = walker.nextNode();
  while (node) {
    var words = node.textContent.trim();
    var el = node.parentElement;
    if (words && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden") {
      var range = document.createRange();
      range.selectNodeContents(node);
      var box = range.getBoundingClientRect();
      var size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 28) { problems.push("'" + words + "' is " + size + "px"); }
      if (!inside(box)) { problems.push("'" + words + "' is too near an edge: " + JSON.stringify(box)); }
    }
    node = walker.nextNode();
  }

  Array.prototype.forEach.call(document.querySelectorAll(".choice"), function (choice) {
    if (choice.getClientRects().length === 0) { return; }
    var box = choice.getBoundingClientRect();
    if (!inside(box)) { problems.push("choice '" + choice.textContent + "' is too near an edge"); }
  });
  return problems;
}

/* Runs in the page: the HUD's visible texts as boxes inside the HUD, left to right. */
function hudBoxes() {
  var hud = document.getElementById("hud").getBoundingClientRect();
  return Array.prototype.slice.call(document.querySelectorAll("#hud span"))
    .filter(function (el) { return el.getClientRects().length > 0; })
    .map(function (el) {
      var r = el.getBoundingClientRect();
      return { id: el.id, left: r.left - hud.left, right: r.right - hud.left };
    })
    .sort(function (a, b) { return a.left - b.left; });
}

/* The HUD row with the biggest score, Sound off and Lives 10: the texts in their places, none touching. */
async function checkHud(page) {
  var boxes = await page.evaluate(hudBoxes);
  assert.deepStrictEqual(boxes.map(function (b) { return b.id; }), ["hud-score", "hud-level", "hud-sound", "hud-lives"]);
  assert.ok(boxes[0].right < 600, "the score ends before 600");
  assert.ok(boxes[2].left >= 1040 && boxes[2].left < 1041, "Sound off starts at 1040");
  assert.ok(Math.abs(boxes[3].right - 1600) < 1, "the lives end at the right edge");
  for (var i = 1; i < boxes.length; i++) {
    assert.ok(boxes[i].left > boxes[i - 1].right, boxes[i].id + " clears " + boxes[i - 1].id);
  }
}

async function checkLayout(page, where) {
  assert.deepStrictEqual(await page.evaluate(measure), [], "layout on " + where);
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  var page = await h.openPage(context, url);

  await checkLayout(page, "the title");
  await h.startGame(page);
  await h.tap(page, K.M);
  assert.ok(await page.isVisible("#hud-sound"), "Sound off shows in the HUD");
  await h.seed(page, { score: 999999999999 });
  assert.strictEqual(await h.text(page, "#hud-score"), "Score 999,999,999,999");
  assert.strictEqual(await h.text(page, "#hud-lives"), "Lives 10");
  await checkHud(page);
  await checkLayout(page, "play in Serve, with the biggest score, Sound off and Lives 10 showing");
  await h.tap(page, K.M);

  await h.seed(page, { score: 1234567 });
  await h.tap(page, K.P);
  await checkLayout(page, "the pause dialog");
  await h.tap(page, K.P);

  await h.seed(page, h.atCore([{ col: 0, row: 2, color: "R" }]));
  await page.clock.runFor(100);
  assert.strictEqual((await h.snap(page)).state, "dissolve");
  assert.ok(await page.isVisible("#play-bonus"));
  var gap = await page.evaluate(function () {
    return document.getElementById("play-bonus").getBoundingClientRect().top -
      document.getElementById("playfield").getBoundingClientRect().top;
  });
  assert.strictEqual(gap, 508, "the bonus line is 508px below the playfield's top");
  await checkLayout(page, "the dissolve, with the bonus line");
  await page.clock.runFor(1100);
  assert.ok(await page.isVisible("#play-banner"));
  assert.ok(await page.isVisible("#play-bonus"));
  await checkLayout(page, "the level banner, with the bonus line");
  await page.clock.runFor(1500);

  // Level 4: its banner, then Serve, then Moving with a bolt in the air.
  await h.seed(page, Object.assign({ level: 3 }, h.atCore(h.FAR_BRICKS)));
  await page.clock.runFor(1200);
  assert.strictEqual(await h.text(page, "#play-banner"), "Level 4");
  await checkLayout(page, "the level 4 banner");
  await page.clock.runFor(1600);
  assert.strictEqual((await h.snap(page)).level, 4);
  await checkLayout(page, "level 4 in Serve");
  await h.tap(page, K.SPACE);
  await h.seed(page, { ball: { x: 100, y: 700, vx: 0, vy: 0 } });
  await page.clock.runFor(2300);
  assert.strictEqual((await h.snap(page)).bolts.length, 1);
  await checkLayout(page, "level 4 with a bolt in the air");

  await h.seed(page, { lives: 1, ball: { x: 100, y: 600, vx: 0, vy: 720 } });
  await page.clock.runFor(1000);
  assert.strictEqual((await h.snap(page)).screen, "over");
  await checkLayout(page, "game over with a new best and its three choices");

  await h.tap(page, K.BACK);
  await h.tap(page, K.BACK);
  assert.ok(await page.isVisible("#dialog-leave"));
  await checkLayout(page, "the leave dialog");

  assert.deepStrictEqual(page.errors, []);
  console.log("layout drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
