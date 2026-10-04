var test = require("node:test");
var assert = require("node:assert");
var path = require("path");
var jsCheck = require("../../tools/lint/js-check");
var fixtures = require("./lint-fixture-helpers.js");

var DIR = path.join(__dirname, "..", "lint-fixtures", "js");

function load(name) {
  return fixtures.loadFixture(DIR, name);
}

var lists = fixtures.listFixtures(DIR);
var failFixtures = lists.fail;
var passFixtures = lists.pass;

// Acceptance 2 requires one failing fixture per forbidden feature and one
// passing fixture per allowed lookalike; list the required names explicitly
// so a missing fixture fails loudly instead of just lowering a count.
var REQUIRED_FAIL = [
  "fail-replaceall.js",
  "fail-at-dot.js",
  "fail-at-bracket.js",
  "fail-promise-any.js",
  "fail-object-hasown.js",
  "fail-structuredclone.js",
  "fail-structuredclone-member-dot.js",
  "fail-structuredclone-member-bracket.js",
  "fail-structuredclone-unrelated-shadow.js",
  "fail-promise-any-window-dot.js",
  "fail-object-hasown-window-bracket.js",
  "fail-optional-chaining.js",
  "fail-nullish-coalescing.js"
];
var REQUIRED_PASS = [
  "pass-math-min.js",
  "pass-object-key-at.js",
  "pass-field-named-at.js",
  "pass-local-structuredclone.js"
];

failFixtures.forEach(function (name) {
  test("js fixture " + name + " fails the lint", function () {
    var problems = jsCheck.checkJs(load(name));
    assert.ok(problems.length > 0, name + " should report at least one problem");
  });
});

passFixtures.forEach(function (name) {
  test("js fixture " + name + " passes the lint", function () {
    var problems = jsCheck.checkJs(load(name));
    assert.deepStrictEqual(problems, [], name + " should report no problems");
  });
});

test("every required js fixture named by Acceptance 2 exists", function () {
  REQUIRED_FAIL.forEach(function (name) {
    assert.ok(failFixtures.indexOf(name) !== -1, "missing failing fixture " + name);
  });
  REQUIRED_PASS.forEach(function (name) {
    assert.ok(passFixtures.indexOf(name) !== -1, "missing passing fixture " + name);
  });
});

test("arr.at(0) as a dot call is reported", function () {
  var problems = jsCheck.checkJs(load("fail-at-dot.js"));
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 2);
});

test("arr['at'](0) as a bracket call is reported", function () {
  var problems = jsCheck.checkJs(load("fail-at-bracket.js"));
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 2);
});

test("reading and assigning a field named at is allowed, only calling at() is forbidden", function () {
  var problems = jsCheck.checkJs(load("pass-field-named-at.js"));
  assert.deepStrictEqual(problems, []);
});

test("replaceAll is reported on its own line", function () {
  var problems = jsCheck.checkJs(load("fail-replaceall.js"));
  assert.strictEqual(problems[0].line, 2);
});

test("a syntax error newer than the engine is reported with its line", function () {
  var problems = jsCheck.checkJs(load("fail-optional-chaining.js"));
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 2);
});

test("nullish coalescing is a syntax error on this engine", function () {
  var problems = jsCheck.checkJs(load("fail-nullish-coalescing.js"));
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 2);
});

test("Promise.any is reported", function () {
  var problems = jsCheck.checkJs(load("fail-promise-any.js"));
  assert.strictEqual(problems.length, 1);
  assert.ok(problems[0].message.indexOf("Promise.any") !== -1);
});

test("Object.hasOwn is reported", function () {
  var problems = jsCheck.checkJs(load("fail-object-hasown.js"));
  assert.strictEqual(problems.length, 1);
  assert.ok(problems[0].message.indexOf("Object.hasOwn") !== -1);
});

test("structuredClone as a bare global call is reported", function () {
  var problems = jsCheck.checkJs(load("fail-structuredclone.js"));
  assert.strictEqual(problems.length, 1);
});

test("window.structuredClone(...) as a dot member call is reported", function () {
  var problems = jsCheck.checkJs(load("fail-structuredclone-member-dot.js"));
  assert.strictEqual(problems.length, 1);
});

test("window['structuredClone'](...) as a bracket member call is reported", function () {
  var problems = jsCheck.checkJs(load("fail-structuredclone-member-bracket.js"));
  assert.strictEqual(problems.length, 1);
});

test("an unrelated parameter named structuredClone does not suppress a real global call", function () {
  var problems = jsCheck.checkJs(load("fail-structuredclone-unrelated-shadow.js"));
  assert.strictEqual(problems.length, 1);
  assert.strictEqual(problems[0].line, 4);
});

test("referencing structuredClone without calling it passes", function () {
  var problems = jsCheck.checkJs(load("pass-local-structuredclone.js"));
  assert.deepStrictEqual(problems, []);
});

test("hasOwnProperty is not mistaken for hasOwn", function () {
  var problems = jsCheck.checkJs("var ok = obj.hasOwnProperty('x');");
  assert.deepStrictEqual(problems, []);
});

test("window.Promise.any(...) is reported", function () {
  var problems = jsCheck.checkJs(load("fail-promise-any-window-dot.js"));
  assert.strictEqual(problems.length, 1);
  assert.ok(problems[0].message.indexOf("Promise.any") !== -1);
});

test("window['Object']['hasOwn'](...) is reported", function () {
  var problems = jsCheck.checkJs(load("fail-object-hasown-window-bracket.js"));
  assert.strictEqual(problems.length, 1);
  assert.ok(problems[0].message.indexOf("Object.hasOwn") !== -1);
});
