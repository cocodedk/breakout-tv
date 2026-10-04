/* Breakout drive helpers: a page on Playwright's clock, synthetic keys with a forced keyCode, and
   quick reads of the game's snapshot. Time moves only when a drive calls page.clock.runFor. */
"use strict";
var assert = require("node:assert");

var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, A: 65, D: 68, ENTER: 13, SPACE: 32, P: 80,
  M: 77, BACK: 10009, ESC: 27, BACKSPACE: 8 };

/* Opens a new page in the context with the clock paused, and collects its console errors. */
async function openPage(context, url) {
  var page = await context.newPage();
  page.errors = [];
  page.prevented = [];
  page.on("pageerror", function (e) { page.errors.push(String(e)); });
  page.on("console", function (m) { if (m.type() === "error") { page.errors.push(m.text()); } });
  await page.clock.install({ time: 0 });
  await page.goto(url);
  await page.clock.pauseAt(60000);
  return page;
}

/* Sends one key event and notes whether the game stopped its default action. */
async function send(page, type, code) {
  var prevented = await page.evaluate(function (args) {
    var e = new KeyboardEvent(args.type, { bubbles: true, cancelable: true });
    Object.defineProperty(e, "keyCode", { get: function () { return args.code; } });
    document.body.dispatchEvent(e);
    return e.defaultPrevented;
  }, { type: type, code: code });
  page.prevented.push({ type: type, code: code, prevented: prevented });
}

async function down(page, code) { await send(page, "keydown", code); }
async function up(page, code) { await send(page, "keyup", code); }

async function tap(page, code) {
  await down(page, code);
  await up(page, code);
}

/* Holds a key for ms of game time; sends the keyup too unless withKeyup is false. */
async function hold(page, code, ms, withKeyup) {
  await down(page, code);
  await page.clock.runFor(ms);
  if (withKeyup !== false) { await up(page, code); }
}

function snap(page) {
  return page.evaluate(function () { return window.BO.game.snapshot(); });
}

function seed(page, patch) {
  return page.evaluate(function (p) { window.BO.game.seed(p); }, patch);
}

function text(page, selector) {
  return page.textContent(selector);
}

/* Starts a new game from the title with Enter. */
async function startGame(page) {
  await tap(page, KEY.ENTER);
  await page.clock.runFor(50);
}

/* Asserts that actual is within tolerance of expected. */
function near(actual, expected, tolerance, what) {
  assert.ok(Math.abs(actual - expected) <= tolerance, what + ": " + actual + " should be " + expected + " +-" + tolerance);
}

/* A seed for a core hit: the ball just below the core's strip, flying straight up as the core slides
   into its path, over the given bricks (none by default). */
/* Two bricks at the far left and right of row 2, out of the ball's way: a wall still standing. */
var FAR_BRICKS = [{ col: 0, row: 2, color: "R" }, { col: 11, row: 2, color: "R" }];

function atCore(bricks) {
  return { bricks: bricks || [], core: { x: 780, dir: 1 }, ball: { x: 800, y: 110, vx: 0, vy: -720 } };
}

module.exports = { KEY: KEY, openPage: openPage, down: down, up: up, tap: tap, hold: hold,
  snap: snap, seed: seed, text: text, startGame: startGame, near: near, atCore: atCore,
  FAR_BRICKS: FAR_BRICKS };
