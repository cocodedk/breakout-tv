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
  await checkLayout(page, "play in Serve, with Sound off showing");
  await h.tap(page, K.M);

  await h.seed(page, { score: 1234567 });
  await h.tap(page, K.P);
  await checkLayout(page, "the pause dialog");
  await h.tap(page, K.P);

  await h.seed(page, h.atCore([{ col: 0, row: 2, color: "R" }]));
  await page.clock.runFor(100);
  assert.strictEqual((await h.snap(page)).state, "dissolve");
  await checkLayout(page, "the dissolve");
  await page.clock.runFor(1100);
  assert.ok(await page.isVisible("#play-banner"));
  await checkLayout(page, "the level banner");
  await page.clock.runFor(1500);

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
