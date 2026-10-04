"use strict";

var util = require("./util");
var stripCommentsAndStrings = require("./css-strip").stripCommentsAndStrings;

var FORBIDDEN_PROPS = new Set(["gap", "row-gap", "column-gap", "aspect-ratio", "inset"]);
var FORBIDDEN_FUNCS = ["min", "max", "clamp"];
var FORBIDDEN_SELECTORS = [":focus-visible", ":is(", ":where("];
var ALLOWED_AT_NESTING = new Set(["keyframes", "font-face", "page"]);

function atNameOf(prelude) {
  var m = /^@([a-zA-Z-]+)/.exec(prelude.trim());
  return m ? m[1].toLowerCase() : null;
}

// Nesting is judged by style-rule ancestry, not by how deep the at-rule
// nesting goes: @media and @supports may nest inside each other without
// limit, but anything under a style rule (with or without &) fails, and so
// does anything under an at-rule that itself sits under a style rule.
function nestingFails(parent) {
  if (!parent) { return false; }
  if (parent.kind === "style") { return true; }
  if (ALLOWED_AT_NESTING.has(parent.atName)) { return false; }
  return parent.hasStyleAncestor;
}

function checkPrelude(text, offset, problems, lineStarts) {
  for (var i = 0; i < FORBIDDEN_SELECTORS.length; i++) {
    var needle = FORBIDDEN_SELECTORS[i];
    var re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    var m;
    while ((m = re.exec(text))) {
      if (text[m.index - 1] === "\\") { continue; }
      problems.push({
        line: util.lineAt(lineStarts, offset + m.index),
        message: "CSS selector '" + needle + "' is not supported on this TV's engine"
      });
    }
  }
  var trimmed = text.trim();
  if (trimmed[0] === "@" && atNameOf(text) === "container") {
    problems.push({
      line: util.lineAt(lineStarts, offset + text.indexOf("@")),
      message: "the '@container' at-rule is not supported on this TV's engine"
    });
  }
}

function checkDeclaration(text, offset, problems, lineStarts) {
  var propMatch = /^\s*([a-zA-Z-]+)\s*:/.exec(text);
  if (propMatch) {
    var propName = propMatch[1].toLowerCase();
    if (FORBIDDEN_PROPS.has(propName)) {
      problems.push({
        line: util.lineAt(lineStarts, offset + text.indexOf(propMatch[1])),
        message: "CSS property '" + propName + "' is not supported on this TV's engine"
      });
    }
  }
  var funcRe = new RegExp("\\b(" + FORBIDDEN_FUNCS.join("|") + ")\\s*\\(", "gi");
  var m;
  while ((m = funcRe.exec(text))) {
    problems.push({
      line: util.lineAt(lineStarts, offset + m.index),
      message: "CSS function '" + m[1].toLowerCase() + "()' is not supported on this TV's engine"
    });
  }
}

function findMatchingClose(clean, openBraceIdx, hardEnd) {
  var depth = 1;
  var j = openBraceIdx + 1;
  while (j < hardEnd && depth > 0) {
    if (clean[j] === "{") { depth++; } else if (clean[j] === "}") { depth--; }
    j++;
  }
  return j - 1;
}

// A flat segment (no braces of its own) is either an ordinary declaration or
// a semicolon-terminated at-rule such as `@layer foo;` or `@import url(...);`.
// The latter is judged by the same style-rule-ancestry nesting rule as a
// block at-rule: any at-rule directly inside a style rule fails.
function handleFlatSegment(text, offset, parent, problems, lineStarts) {
  if (text.trim()[0] === "@") {
    if (nestingFails(parent)) {
      problems.push({
        line: util.lineAt(lineStarts, offset + text.search(/\S/)),
        message: "nested CSS rules are not supported on this TV's engine"
      });
    }
    checkPrelude(text, offset, problems, lineStarts);
    return;
  }
  checkDeclaration(text, offset, problems, lineStarts);
}

function parseBlock(clean, start, end, parent, problems, lineStarts) {
  var cursor = start;
  while (cursor < end) {
    var semi = clean.indexOf(";", cursor);
    if (semi === -1 || semi >= end) { semi = Infinity; }
    var brace = clean.indexOf("{", cursor);
    if (brace === -1 || brace >= end) { brace = Infinity; }

    if (semi === Infinity && brace === Infinity) {
      handleFlatSegment(clean.slice(cursor, end), cursor, parent, problems, lineStarts);
      break;
    }
    if (brace < semi) {
      var prelude = clean.slice(cursor, brace);
      var close = findMatchingClose(clean, brace, end);
      var atName = atNameOf(prelude);
      var childKind = prelude.trim()[0] === "@" ? "atrule" : "style";

      if (nestingFails(parent)) {
        problems.push({
          line: util.lineAt(lineStarts, cursor + prelude.search(/\S/)),
          message: "nested CSS rules are not supported on this TV's engine"
        });
      }
      checkPrelude(prelude, cursor, problems, lineStarts);

      var childInfo = {
        kind: childKind,
        atName: atName,
        hasStyleAncestor: !!parent && (parent.kind === "style" || parent.hasStyleAncestor)
      };
      parseBlock(clean, brace + 1, close, childInfo, problems, lineStarts);
      cursor = close + 1;
    } else {
      handleFlatSegment(clean.slice(cursor, semi), cursor, parent, problems, lineStarts);
      cursor = semi + 1;
    }
  }
}

function checkCss(source) {
  var problems = [];
  var clean = stripCommentsAndStrings(source);
  var lineStarts = util.computeLineStarts(source);
  parseBlock(clean, 0, clean.length, null, problems, lineStarts);
  return problems;
}

module.exports = { checkCss: checkCss };
