"use strict";
var test = require("node:test");
var assert = require("node:assert");
var titleLevel = require("../../js/title-level.js");

test("a saved level from 1 to 4 is that level", function () {
  assert.deepStrictEqual(["1", "2", "3", "4"].map(titleLevel.parse), [1, 2, 3, 4]);
});

test("anything else counts as level 1", function () {
  ["7", "0", "-1", "5", "2.5", "abc", "", null, undefined].forEach(function (raw) {
    assert.strictEqual(titleLevel.parse(raw), 1, String(raw));
  });
});
