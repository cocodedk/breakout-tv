"use strict";
var test = require("node:test");
var assert = require("node:assert");
var levels = require("../../js/levels.js");

function at(bricks, x, y) {
  return bricks.filter(function (b) { return b.x === x && b.y === y; })[0];
}

/* The y of layout row n: the top row is at 120 and rows are 28px apart. */
function row(n) { return 120 + n * 28; }

test("the three levels have 120, 72 and 84 bricks in 10, 12 and 12 rows", function () {
  assert.strictEqual(levels.COUNT, 3);
  assert.deepStrictEqual([1, 2, 3].map(function (n) { return levels.build(n).length; }), [120, 72, 84]);
  assert.deepStrictEqual(levels.LAYOUTS.map(function (rows) { return rows.length; }), [10, 12, 12]);
});

test("every layout row is 12 characters", function () {
  levels.LAYOUTS.forEach(function (rows) {
    rows.forEach(function (line) { assert.strictEqual(line.length, 12); });
  });
});

test("each layout line appears twice, one under the other", function () {
  levels.LAYOUTS.forEach(function (rows) {
    for (var i = 0; i < rows.length; i += 2) { assert.strictEqual(rows[i], rows[i + 1]); }
  });
});

test("level 1 is ten rows from x 36, y 120 with 120x20 bricks, 128px columns and 28px rows", function () {
  var bricks = levels.build(1);
  assert.strictEqual(at(bricks, 36, row(0)).color, "R");
  assert.strictEqual(at(bricks, 36 + 11 * 128, row(1)).color, "R");
  assert.strictEqual(at(bricks, 36, row(2)).color, "O");
  assert.strictEqual(at(bricks, 36, row(4)).color, "Y");
  assert.strictEqual(at(bricks, 36, row(6)).color, "G");
  assert.strictEqual(at(bricks, 36, row(9)).color, "B");
  assert.strictEqual(at(bricks, 36, row(0)).w, 120);
  assert.strictEqual(at(bricks, 36, row(0)).h, 20);
});

test("level 2 alternates its columns", function () {
  var bricks = levels.build(2);
  assert.ok(at(bricks, 36, row(0)), "row 0 starts with a brick");
  assert.ok(!at(bricks, 36 + 128, row(0)), "row 0 skips column 1");
  assert.strictEqual(at(bricks, 36 + 128, row(2)).color, "O");
  assert.strictEqual(at(bricks, 36 + 11 * 128, row(11)).color, "B");
  assert.ok(!at(bricks, 36, row(10)), "row 10 starts empty");
});

test("level 3 has 24 silver two-hit bricks on top and a blue tip", function () {
  var bricks = levels.build(3);
  var top = bricks.filter(function (b) { return b.y === row(0) || b.y === row(1); });
  assert.strictEqual(top.length, 24);
  top.forEach(function (b) {
    assert.strictEqual(b.color, "S");
    assert.strictEqual(b.hits, 2);
    assert.strictEqual(b.points, 100);
  });
  assert.strictEqual(bricks.filter(function (b) { return b.color === "S"; }).length, 24);
  var tip = bricks.filter(function (b) { return b.y === row(11); });
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
