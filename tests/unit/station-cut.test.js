"use strict";
var test = require("node:test");
var assert = require("node:assert");
var levels = require("../../js/levels.js");
var station = require("../../js/station.js");
var helpers = require("./station-helpers.js");

var STEP = helpers.STEP;
var level4 = helpers.level4;
var bolt = helpers.bolt;
var speedOf = helpers.speedOf;

/* Level 4 with a column of a red, a silver (2 hits) and a light grey brick under the station, x 420 to 540. */
function column() {
  var s = level4();
  s.station.x = 1400;
  s.bricks = [levels.brick(3, 0, "R", 260), levels.brick(3, 1, "S", 260), levels.brick(3, 2, "L", 260)];
  return s;
}

function fly(s, steps) {
  var events = [];
  for (var i = 0; i < steps; i++) { events = events.concat(station.step(s, STEP)); }
  return events;
}

test("the station starts at x 800 moving right and moves 80 px in 1 s", function () {
  var s = level4();
  fly(s, 240);
  assert.ok(Math.abs(s.station.x - 880) < 1e-6 && s.station.dir === 1, "x " + s.station.x);
});

test("the station turns back the moment it reaches 1440 and 160", function () {
  var s = level4();
  s.station.x = 1439;
  fly(s, 120);
  assert.strictEqual(s.station.dir, -1);
  assert.ok(s.station.x < 1440 && s.station.x > 1390, "x " + s.station.x);
  s.station.x = 161;
  s.station.dir = -1;
  fly(s, 120);
  assert.strictEqual(s.station.dir, 1);
  assert.ok(s.station.x > 160 && s.station.x < 210, "x " + s.station.x);
});

test("the station moves in Serve too", function () {
  var s = level4();
  s.serving = true;
  fly(s, 240);
  assert.ok(Math.abs(s.station.x - 880) < 1e-6);
});

test("the ball hits the station where it is now, and misses where it was", function () {
  var s = level4();
  s.station.x = 1000;
  s.ball.x = 1000;
  s.ball.y = 140 + 100 + 11;
  assert.deepStrictEqual(station.step(s, STEP), ["core"]);
  s = level4();
  s.station.x = 1000;
  s.ball.x = 800;
  s.ball.y = 140;
  assert.deepStrictEqual(station.step(s, STEP), [], "the old place is empty");
});

test("a ball overlapping the station's position after its move is a hit", function () {
  var s = level4();
  s.ball.x = 912.2;
  s.ball.y = 140;
  assert.deepStrictEqual(station.step(s, STEP), ["core"]);
});

test("a gold bolt cuts a column of three bricks, keeps its course and scores their points", function () {
  var s = column();
  s.bolts = [bolt(480, 450, 0, -900, true)];
  var events = fly(s, 80);
  assert.deepStrictEqual([s.bricks.length, s.score, s.broken], [0, 50 + 100 + 30, 3]);
  assert.strictEqual(events.filter(function (e) { return e === "cut"; }).length >= 1, true);
  assert.deepStrictEqual([s.bolts[0].vx, s.bolts[0].vy, speedOf(s.bolts[0])], [0, -900, 900]);
});

test("a gold bolt that cut bricks and then reaches the station still scores 1000", function () {
  var s = column();
  s.station.x = 480;
  s.bolts = [bolt(480, 450, 0, -900, true)];
  var events = fly(s, 80);
  assert.ok(events.indexOf("station-hit") >= 0 && s.bolts.length === 0);
  assert.deepStrictEqual([s.bricks.length, s.score], [0, 180 + 1000]);
});

test("several bricks destroyed in one step give one cut", function () {
  var s = column();
  s.bricks.forEach(function (b) { b.y = 400; });
  s.bolts = [bolt(480, 420, 0, -90, true)];
  assert.deepStrictEqual(station.step(s, STEP), ["cut"]);
  assert.strictEqual(s.bricks.length, 0);
});

test("a green bolt flies through the same column and leaves it standing", function () {
  var s = column();
  s.bolts = [bolt(480, 250, 0, 600)];
  fly(s, 60);
  assert.deepStrictEqual([s.bricks.length, s.score, s.broken], [3, 0, 0]);
});

test("a gold bolt that passes beside a brick leaves it standing", function () {
  var s = column();
  s.bolts = [bolt(420 - 3 - 1, 450, 0, -900, true), bolt(540 + 3 + 1, 450, 0, -900, true)];
  fly(s, 80);
  assert.deepStrictEqual([s.bricks.length, s.score, s.broken], [3, 0, 0]);
});
