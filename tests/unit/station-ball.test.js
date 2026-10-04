"use strict";
var test = require("node:test");
var assert = require("node:assert");
var station = require("../../js/station.js");
var helpers = require("./station-helpers.js");

var STEP = helpers.STEP;
var level4 = helpers.level4;
var bolt = helpers.bolt;

test("the ball touching the station's disc is a hit, worth 500, and every bolt goes", function () {
  var s = level4();
  s.bolts = [bolt(1500, 50, 0, 10)];
  s.ball.x = s.station.x;
  s.ball.y = 140 + 100 + 11;
  s.ball.vx = 0;
  s.ball.vy = -720;
  assert.deepStrictEqual(station.step(s, STEP), ["core"]);
  assert.deepStrictEqual([s.score, s.bolts.length, s.ball.vy], [500, 0, -720]);
  s.score = 0;
  s.ball.y += 2;
  assert.deepStrictEqual(station.step(s, STEP), [], "a ball just outside the disc is no hit");
});

test("the ball is not tested against the station in Serve", function () {
  var s = level4();
  s.serving = true;
  s.ball.x = 800;
  s.ball.y = 140;
  assert.deepStrictEqual(station.step(s, STEP), []);
});

test("in Serve the bolts already flying keep moving, can be batted back and can score", function () {
  var s = level4();
  s.serving = true;
  s.bolts = [bolt(800, 801, 0, 600), bolt(800, 245, 0, -900, true)];
  var events = [];
  for (var i = 0; i < 4; i++) { events = events.concat(station.step(s, STEP)); }
  assert.deepStrictEqual(events.sort(), ["reflect", "station-hit"]);
  assert.strictEqual(s.score, 1000);
});

test("the station charges during the half second before a shot, only while Moving", function () {
  var s = level4();
  assert.strictEqual(station.charging(s), false);
  s.fireIn = 0.5;
  assert.strictEqual(station.charging(s), true);
  s.serving = true;
  assert.strictEqual(station.charging(s), false);
  s.serving = false;
  s.station = null;
  assert.strictEqual(station.charging(s), false);
});
