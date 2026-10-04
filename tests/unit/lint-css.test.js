var test = require("node:test");
var assert = require("node:assert");
var path = require("path");
var cssCheck = require("../../tools/lint/css-check");
var fixtures = require("./lint-fixture-helpers.js");

var DIR = path.join(__dirname, "..", "lint-fixtures", "css");

function load(name) {
  return fixtures.loadFixture(DIR, name);
}

var lists = fixtures.listFixtures(DIR);
var failFixtures = lists.fail;
var passFixtures = lists.pass;

// Acceptance 2 requires one failing fixture per forbidden feature and
// nesting shape, and one passing fixture per allowed lookalike; list the
// required names explicitly so a missing fixture fails loudly.
var REQUIRED_FAIL = [
  "fail-gap.css",
  "fail-row-gap.css",
  "fail-column-gap.css",
  "fail-aspect-ratio.css",
  "fail-inset.css",
  "fail-min.css",
  "fail-max.css",
  "fail-clamp.css",
  "fail-focus-visible.css",
  "fail-is.css",
  "fail-where.css",
  "fail-container.css",
  "fail-nesting-plain.css",
  "fail-nesting-amp.css",
  "fail-nesting-media-bare-decls.css",
  "fail-nesting-supports-in-style.css",
  "fail-escaped-newline-line-accuracy.css",
  "fail-url-quoted-paren-real-decl.css",
  "fail-nesting-at-rule-semicolon.css"
];
var REQUIRED_PASS = [
  "pass-grid-gap.css",
  "pass-media-top-level.css",
  "pass-supports-top-level.css",
  "pass-inset-hover.css",
  "pass-escaped-focus-visible.css",
  "pass-keyframes.css",
  "pass-last-decl-no-semicolon.css",
  "pass-nested-media-in-media.css",
  "pass-nested-supports-in-supports.css",
  "pass-url-semicolon.css",
  "pass-url-brace.css",
  "pass-url-quoted-paren-and-semicolon.css"
];

failFixtures.forEach(function (name) {
  test("css fixture " + name + " fails the lint", function () {
    var problems = cssCheck.checkCss(load(name));
    assert.ok(problems.length > 0, name + " should report at least one problem");
  });
});

passFixtures.forEach(function (name) {
  test("css fixture " + name + " passes the lint", function () {
    var problems = cssCheck.checkCss(load(name));
    assert.deepStrictEqual(problems, [], name + " should report no problems");
  });
});

test("every required css fixture named by Acceptance 2 exists", function () {
  REQUIRED_FAIL.forEach(function (name) {
    assert.ok(failFixtures.indexOf(name) !== -1, "missing failing fixture " + name);
  });
  REQUIRED_PASS.forEach(function (name) {
    assert.ok(passFixtures.indexOf(name) !== -1, "missing passing fixture " + name);
  });
});

test("gap is reported on its declaration line", function () {
  var problems = cssCheck.checkCss(load("fail-gap.css"));
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 3);
});

test("column-gap in upper case is still caught", function () {
  var problems = cssCheck.checkCss(load("fail-column-gap.css"));
  assert.strictEqual(problems.length, 1);
  assert.ok(problems[0].message.indexOf("column-gap") !== -1);
});

test("a rule nested with & still fails", function () {
  var problems = cssCheck.checkCss(load("fail-nesting-amp.css"));
  assert.ok(problems.some(function (p) { return p.message.indexOf("nested") !== -1; }));
});

test("a bare declaration inside @media inside a style rule fails on nesting", function () {
  var problems = cssCheck.checkCss(load("fail-nesting-media-bare-decls.css"));
  assert.ok(problems.some(function (p) { return p.message.indexOf("nested") !== -1; }));
});

test("@supports inside a style rule fails on nesting, same as @media", function () {
  var problems = cssCheck.checkCss(load("fail-nesting-supports-in-style.css"));
  assert.ok(problems.some(function (p) { return p.message.indexOf("nested") !== -1; }));
});

test("@media nested inside @media passes: nesting is judged by style ancestry", function () {
  var problems = cssCheck.checkCss(load("pass-nested-media-in-media.css"));
  assert.deepStrictEqual(problems, []);
});

test("@supports nested inside @supports passes", function () {
  var problems = cssCheck.checkCss(load("pass-nested-supports-in-supports.css"));
  assert.deepStrictEqual(problems, []);
});

test("@container fails regardless of what is inside it", function () {
  var problems = cssCheck.checkCss(load("fail-container.css"));
  assert.ok(problems.some(function (p) { return p.message.indexOf("@container") !== -1; }));
});

test("minmax( is not mistaken for min( or max(", function () {
  var problems = cssCheck.checkCss(".box { grid-template-columns: minmax(200px, 1fr); }");
  assert.deepStrictEqual(problems, []);
});

test("a last declaration without a trailing semicolon is still checked", function () {
  var problems = cssCheck.checkCss(".box {\n  gap: 4px\n}\n");
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 2);
});

test("comments do not hide forbidden features", function () {
  var problems = cssCheck.checkCss(".box {\n  /* gap: 4px; */\n  color: red;\n}\n");
  assert.deepStrictEqual(problems, []);
});

test("a semicolon inside url(...) does not split a declaration or false-flag gap", function () {
  var problems = cssCheck.checkCss(load("pass-url-semicolon.css"));
  assert.deepStrictEqual(problems, []);
});

test("a brace inside url(...) does not confuse nesting detection", function () {
  var problems = cssCheck.checkCss(load("pass-url-brace.css"));
  assert.deepStrictEqual(problems, []);
});

test("an escaped newline inside a string does not shift later line numbers", function () {
  var problems = cssCheck.checkCss(load("fail-escaped-newline-line-accuracy.css"));
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 6);
});

test("a quoted unbalanced paren inside url(...) does not swallow the rest of the file", function () {
  var problems = cssCheck.checkCss(load("fail-url-quoted-paren-real-decl.css"));
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 3);
  assert.ok(problems[0].message.indexOf("gap") !== -1);
});

test("a quoted close-paren and semicolon inside url(...) do not false-flag gap", function () {
  var problems = cssCheck.checkCss(load("pass-url-quoted-paren-and-semicolon.css"));
  assert.deepStrictEqual(problems, []);
});

test("a semicolon-terminated at-rule like @layer inside a style rule fails on nesting", function () {
  var problems = cssCheck.checkCss(load("fail-nesting-at-rule-semicolon.css"));
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 2);
  assert.ok(problems[0].message.indexOf("nested") !== -1);
});
