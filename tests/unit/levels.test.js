"use strict";
var test = require("node:test");
var assert = require("node:assert");
var levels = require("../../js/levels.js");

function at(bricks, x, y) {
  return bricks.filter(function (b) { return b.x === x && b.y === y; })[0];
}

test("the three levels have 60, 36 and 42 bricks", function () {
  assert.strictEqual(levels.COUNT, 3);
  assert.deepStrictEqual([1, 2, 3].map(function (n) { return levels.build(n).length; }), [60, 36, 42]);
});

test("every layout row is 12 characters", function () {
  levels.LAYOUTS.forEach(function (rows) {
    rows.forEach(function (row) { assert.strictEqual(row.length, 12); });
  });
});

test("level 1 is five full rows from x 36, y 96 with 128px columns and 48px rows", function () {
  var bricks = levels.build(1);
  assert.strictEqual(at(bricks, 36, 96).color, "R");
  assert.strictEqual(at(bricks, 36 + 11 * 128, 96).color, "R");
  assert.strictEqual(at(bricks, 36, 96 + 48).color, "O");
  assert.strictEqual(at(bricks, 36, 96 + 96).color, "Y");
  assert.strictEqual(at(bricks, 36, 96 + 144).color, "G");
  assert.strictEqual(at(bricks, 36, 96 + 192).color, "B");
  assert.strictEqual(at(bricks, 36, 96).w, 120);
  assert.strictEqual(at(bricks, 36, 96).h, 40);
});

test("level 2 alternates its columns", function () {
  var bricks = levels.build(2);
  assert.ok(at(bricks, 36, 96), "row 0 starts with a brick");
  assert.ok(!at(bricks, 36 + 128, 96), "row 0 skips column 1");
  assert.strictEqual(at(bricks, 36 + 128, 96 + 48).color, "O");
  assert.strictEqual(at(bricks, 36 + 11 * 128, 96 + 5 * 48).color, "B");
  assert.ok(!at(bricks, 36, 96 + 5 * 48), "row 5 starts empty");
});

test("level 3 has a silver top row of two-hit bricks and a blue tip", function () {
  var bricks = levels.build(3);
  var top = bricks.filter(function (b) { return b.y === 96; });
  assert.strictEqual(top.length, 12);
  top.forEach(function (b) {
    assert.strictEqual(b.color, "S");
    assert.strictEqual(b.hits, 2);
    assert.strictEqual(b.points, 100);
  });
  var tip = bricks.filter(function (b) { return b.y === 96 + 5 * 48; });
  assert.deepStrictEqual(tip.map(function (b) { return b.x; }), [36 + 5 * 128, 36 + 6 * 128]);
});

test("only silver needs two hits, and each colour carries its points", function () {
  var points = { R: 50, O: 40, Y: 30, G: 20, B: 10, S: 100 };
  [1, 2, 3].forEach(function (n) {
    levels.build(n).forEach(function (b) {
      assert.strictEqual(b.hits, b.color === "S" ? 2 : 1);
      assert.strictEqual(b.points, points[b.color]);
    });
  });
});

test("build gives a fresh wall each time", function () {
  levels.build(1)[0].hits = 0;
  assert.strictEqual(levels.build(1)[0].hits, 1);
});
