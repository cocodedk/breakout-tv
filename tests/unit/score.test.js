"use strict";
var test = require("node:test");
var assert = require("node:assert");
var score = require("../../js/score.js");

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, actual + " should be " + expected);
}

test("points per colour", function () {
  assert.deepStrictEqual(
    ["R", "O", "Y", "G", "B", "S"].map(score.points),
    [50, 40, 30, 20, 10, 100]
  );
});

test("the start speed is 720 px/s, up 10% for every loop", function () {
  near(score.startSpeed(0), 720);
  near(score.startSpeed(1), 792);
  near(score.startSpeed(2), 871.2);
});

test("the core is worth 500 points", function () {
  assert.strictEqual(score.CORE_POINTS, 500);
});

test("the speed rises 5% for every 20 bricks broken, compounded", function () {
  near(score.speed(0, 0), 720);
  near(score.speed(0, 19), 720);
  near(score.speed(0, 20), 756);
  near(score.speed(0, 50), 720 * 1.05 * 1.05);
  near(score.speed(1, 20), 792 * 1.05);
});

test("the speed never goes above 1200 px/s", function () {
  assert.strictEqual(score.speed(0, 2000), 1200);
  assert.strictEqual(score.speed(8, 0), 1200);
  assert.ok(score.speed(0, 300) <= 1200);
});

test("the best score is read from stored text, 0 when there is none", function () {
  assert.strictEqual(score.parseBest("1234"), 1234);
  assert.strictEqual(score.parseBest(null), 0);
  assert.strictEqual(score.parseBest("junk"), 0);
});

test("the best score changes only when the score is higher", function () {
  assert.deepStrictEqual(score.submitBest(500, 600), { best: 600, isNew: true });
  assert.deepStrictEqual(score.submitBest(500, 500), { best: 500, isNew: false });
  assert.deepStrictEqual(score.submitBest(500, 100), { best: 500, isNew: false });
  assert.deepStrictEqual(score.submitBest(0, 0), { best: 0, isNew: false });
  assert.deepStrictEqual(score.submitBest(0, 50), { best: 50, isNew: true });
});
