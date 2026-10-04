"use strict";
var test = require("node:test");
var assert = require("node:assert");
var physics = require("../../js/physics.js");
var levels = require("../../js/levels.js");
var station = require("../../js/station.js");
var helpers = require("./station-helpers.js");

var STEP = helpers.STEP;
var level4 = helpers.level4;
var bolt = helpers.bolt;
var speedOf = helpers.speedOf;

test("level 4 has the station and no UFO, the other levels the UFO and no station", function () {
  var s = physics.newState([]);
  station.setup(s, 4);
  assert.deepStrictEqual([s.station, s.core, s.bolts, s.fireIn], [{ x: 800, y: 140, r: 100 }, null, [], 2]);
  station.setup(s, 3);
  assert.deepStrictEqual([s.station, s.core], [null, { x: 800, dir: 1 }]);
  assert.deepStrictEqual(station.step(s, STEP), [], "nothing happens without a station");
});

test("the first shot comes 2.0 s after the launch and then one every 3.0 s", function () {
  var s = level4();
  var times = [];
  for (var i = 1; i <= 240 * 9; i++) {
    if (station.step(s, STEP).indexOf("fire") >= 0) {
      times.push(i * STEP);
      s.bolts = [];
    }
  }
  assert.strictEqual(times.length, 3);
  [2, 5, 8].forEach(function (t, n) { assert.ok(Math.abs(times[n] - t) <= STEP + 1e-9, "shot " + n + " at " + times[n]); });
});

test("launching starts the 2 s count again", function () {
  var s = level4();
  s.fireIn = 0.3;
  station.arm(s);
  assert.strictEqual(s.fireIn, 2);
});

test("the station does not fire outside Moving, and its timer waits", function () {
  var s = level4();
  s.serving = true;
  for (var i = 0; i < 240 * 10; i++) { assert.deepStrictEqual(station.step(s, STEP), []); }
  assert.deepStrictEqual([s.bolts.length, s.fireIn], [0, 2]);
});

test("a shot due while 2 bolts are flying is skipped and the timer goes on", function () {
  var s = level4();
  s.bolts = [bolt(1500, 50, 0, 10), bolt(1400, 50, 0, 10)];
  s.fireIn = STEP;
  var events = station.step(s, STEP);
  assert.deepStrictEqual([events, s.bolts.length], [[], 2]);
  assert.ok(Math.abs(s.fireIn - 3) < 1e-9, "the next shot is 3 s away");
});

test("a new bolt leaves the dish at 600 px/s, aimed at the paddle's centre at its top", function () {
  var s = level4();
  s.paddleX = 200;
  s.fireIn = STEP;
  assert.deepStrictEqual(station.step(s, STEP), ["fire"]);
  var b = s.bolts[0];
  assert.deepStrictEqual([b.x, b.y, b.back], [840, 100, false]);
  assert.ok(Math.abs(speedOf(b) - 600) < 1e-9);
  var dx = 320 - 840;
  var dy = 816 - 100;
  assert.ok(Math.abs(b.vx / b.vy - dx / dy) < 1e-9, "its direction points at (320, 816)");
  assert.ok(b.vy > 0);
});

test("a bolt passes through bricks without touching them", function () {
  var s = level4();
  s.bricks = levels.build(4);
  var count = s.bricks.length;
  s.bolts = [bolt(96, 200, 0, 600)];
  for (var i = 0; i < 160; i++) { station.step(s, STEP); }
  assert.strictEqual(s.bricks.length, count);
  assert.ok(s.bricks.every(function (b) { return b.hits === (b.color === "S" ? 2 : 1); }));
  assert.ok(s.bolts[0].y > 500, "it flew on through the wall");
});

test("a green bolt meeting the paddle turns gold and leaves at 900 px/s at the ball's angle", function () {
  [-1, 0, 1].forEach(function (offset) {
    var s = level4();
    s.bolts = [bolt(800 + offset * 120, 801, 0, 600)];
    var events = station.step(s, STEP);
    var b = s.bolts[0];
    assert.deepStrictEqual(events, ["reflect"], "offset " + offset);
    assert.strictEqual(b.back, true);
    assert.ok(Math.abs(speedOf(b) - 900) < 1e-9);
    var angle = Math.PI / 3 * offset;
    assert.ok(Math.abs(b.vx - 900 * Math.sin(angle)) < 1e-9, "vx at offset " + offset);
    assert.ok(Math.abs(b.vy + 900 * Math.cos(angle)) < 1e-9, "vy at offset " + offset);
  });
});

test("the bolt leaves at the same angle the ball would", function () {
  var s = physics.newState([]);
  s.paddleX = 300;
  s.serving = false;
  s.ball.x = 360;
  s.ball.y = 816 - 12 - 1;
  s.ball.vx = 0;
  s.ball.vy = 900;
  physics.step(s, STEP, 0);
  var ball = { vx: s.ball.vx, vy: s.ball.vy };
  station.setup(s, 4);
  s.ball.x = 100;
  s.ball.y = 600;
  s.bolts = [bolt(360, 801, 0, 600)];
  station.step(s, STEP);
  assert.ok(Math.abs(s.bolts[0].vx - ball.vx) < 1e-9 && Math.abs(s.bolts[0].vy - ball.vy) < 1e-9);
});

test("a gold bolt within 100px of the station's centre scores 1000 and is removed", function () {
  var s = level4();
  s.bolts = [bolt(800, 245, 0, -900, true)];
  var events = [];
  for (var i = 0; i < 4 && s.bolts.length; i++) { events = events.concat(station.step(s, STEP)); }
  assert.deepStrictEqual([events, s.score, s.bolts.length], [["station-hit"], 1000, 0]);
});

test("a green bolt at the station does nothing", function () {
  var s = level4();
  s.bolts = [bolt(800, 150, 0, 0)];
  assert.deepStrictEqual(station.step(s, STEP), []);
  assert.deepStrictEqual([s.score, s.bolts.length, s.bolts[0].back], [0, 1, false]);
});

test("a bolt past any edge is removed", function () {
  [[-1, 500], [1601, 500], [800, -1], [800, 881]].forEach(function (p) {
    [false, true].forEach(function (back) {
      var s = level4();
      s.bolts = [bolt(p[0], p[1], 0, 0, back)];
      station.step(s, STEP);
      assert.strictEqual(s.bolts.length, 0, "at " + p + (back ? " gold" : " green"));
    });
  });
});

test("a green bolt that misses the paddle costs nothing", function () {
  var s = level4();
  s.paddleX = 1000;
  s.bolts = [bolt(100, 780, 0, 600)];
  var events = [];
  for (var i = 0; i < 120; i++) { events = events.concat(station.step(s, STEP)); }
  assert.deepStrictEqual([events, s.bolts.length, s.score, s.serving], [[], 0, 0, false]);
});

