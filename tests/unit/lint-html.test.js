var test = require("node:test");
var assert = require("node:assert");
var path = require("path");
var htmlCheck = require("../../tools/lint/html-check");
var fixtures = require("./lint-fixture-helpers.js");

var DIR = path.join(__dirname, "..", "lint-fixtures", "html");

function load(name) {
  return fixtures.loadFixture(DIR, name);
}

test("an inline script with a forbidden call fails", function () {
  var problems = htmlCheck.checkHtml(load("fail-inline-script.html"));
  assert.ok(problems.length > 0);
});

test("an inline script's problem is reported on its real line in the html file", function () {
  var problems = htmlCheck.checkHtml(load("fail-inline-script.html"));
  assert.strictEqual(problems[0].line, 8);
});

test("an inline style with a forbidden property fails", function () {
  var problems = htmlCheck.checkHtml(load("fail-inline-style.html"));
  assert.ok(problems.length > 0);
  assert.strictEqual(problems[0].line, 7);
});

test("an external script src is never inlined into the check", function () {
  var problems = htmlCheck.checkHtml(load("pass-clean.html"));
  assert.deepStrictEqual(problems, []);
});

test("a commented-out script or style tag is never checked", function () {
  var problems = htmlCheck.checkHtml(load("pass-commented-tags.html"));
  assert.deepStrictEqual(problems, []);
});

test("style-looking text inside a real script's JS string is not treated as CSS", function () {
  var problems = htmlCheck.checkHtml(load("pass-style-in-js-string.html"));
  assert.deepStrictEqual(problems, []);
});

test("a script with an unrelated data-src attribute is still checked as inline", function () {
  var problems = htmlCheck.checkHtml(load("fail-script-data-src.html"));
  assert.ok(problems.length > 0, "a script tagged data-src, not src, must still be linted");
});

test("a forbidden-looking tag inside another element's quoted attribute value is not real markup", function () {
  var problems = htmlCheck.checkHtml(load("pass-attr-value-fake-tag.html"));
  assert.deepStrictEqual(problems, []);
});

test("an inline style=\"...\" attribute is checked as real CSS", function () {
  var problems = htmlCheck.checkHtml(load("fail-inline-style-attribute.html"));
  assert.ok(problems.length > 0);
  assert.strictEqual(problems[0].line, 4);
});

test("an inline onclick=\"...\" attribute is checked as real JS", function () {
  var problems = htmlCheck.checkHtml(load("fail-inline-onclick-attribute.html"));
  assert.ok(problems.length > 0);
  assert.strictEqual(problems[0].line, 4);
});

test("a stray slash in a script tag's attributes does not hang the parser", { timeout: 2000 }, function () {
  var problems = htmlCheck.checkHtml(load("fail-stray-slash-in-script-tag.html"));
  assert.ok(problems.length > 0);
});

test("a bare return in an inline event handler is legal, not a syntax error", function () {
  var problems = htmlCheck.checkHtml(load("pass-onclick-return.html"));
  assert.deepStrictEqual(problems, []);
});

test("an HTML entity written for && in an inline event handler is decoded first", function () {
  var problems = htmlCheck.checkHtml(load("pass-onclick-entity.html"));
  assert.deepStrictEqual(problems, []);
});

test("a forbidden call is still caught in an inline handler that also uses entities", function () {
  var problems = htmlCheck.checkHtml(load("fail-onclick-entity-forbidden.html"));
  assert.ok(problems.length > 0);
  assert.ok(problems[0].message.indexOf("at") !== -1);
});

test("a trailing // comment in an inline handler does not swallow the wrapper", function () {
  var problems = htmlCheck.checkHtml(load("pass-onclick-trailing-comment.html"));
  assert.deepStrictEqual(problems, []);
});

test("an out-of-range numeric entity is left undecoded instead of crashing the lint", function () {
  var problems = htmlCheck.checkHtml(load("pass-onclick-invalid-codepoint-entity.html"));
  assert.deepStrictEqual(problems, []);
});
