"use strict";

var acorn = require("acorn");

// Checked regardless of the object a call is made on: `x.at(...)`,
// `x['at'](...)`, and the bare global call `structuredClone(...)` are all
// caught by name, with no attempt at scope-aware shadowing: a same-named
// local binding elsewhere in the file must not suppress a real global call.
var BARE_ONLY = new Set(["structuredClone"]);
var MEMBER_ONLY = new Set(["replaceAll", "at", "structuredClone"]);
var MEMBER_COMBO = [
  { object: "Promise", property: "any" },
  { object: "Object", property: "hasOwn" }
];

// A generic ESTree walk: no acorn-walk, just recurse into any child that
// looks like a node (has a string .type) or an array of such children.
function walk(node, visit) {
  if (!node || typeof node !== "object") { return; }
  if (typeof node.type === "string") { visit(node); }
  for (var key in node) {
    if (key === "loc" || key === "start" || key === "end" || key === "range") { continue; }
    var value = node[key];
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) { walk(value[i], visit); }
    } else if (value && typeof value === "object" && typeof value.type === "string") {
      walk(value, visit);
    }
  }
}

function memberPropertyName(node) {
  if (!node.computed) {
    return node.property.type === "Identifier" ? node.property.name : null;
  }
  if (node.property.type === "Literal" && typeof node.property.value === "string") {
    return node.property.value;
  }
  return null;
}

// True for `Promise`/`Object` itself, or the same name reached through the
// global object as `window.Promise`/`self["Promise"]`.
function referencesGlobal(node, name) {
  if (node.type === "Identifier") { return node.name === name; }
  if (node.type !== "MemberExpression") { return false; }
  if (memberPropertyName(node) !== name) { return false; }
  return node.object.type === "Identifier" && (node.object.name === "window" || node.object.name === "self");
}

function checkJs(source) {
  var problems = [];
  var ast;
  try {
    ast = acorn.parse(source, { ecmaVersion: 2019, sourceType: "script", locations: true });
  } catch (e) {
    var line = e.loc ? e.loc.line : 1;
    problems.push({ line: line, message: "syntax not supported on this TV's engine: " + e.message });
    return problems;
  }

  walk(ast, function (node) {
    if (node.type !== "CallExpression") { return; }
    var callee = node.callee;

    if (callee.type === "Identifier" && BARE_ONLY.has(callee.name)) {
      problems.push({
        line: callee.loc.start.line,
        message: "'" + callee.name + "' is not available on this TV's engine"
      });
      return;
    }

    if (callee.type !== "MemberExpression") { return; }
    var propName = memberPropertyName(callee);
    if (!propName) { return; }

    if (MEMBER_ONLY.has(propName)) {
      problems.push({
        line: callee.property.loc.start.line,
        message: "'" + propName + "' is not available on this TV's engine"
      });
      return;
    }
    for (var i = 0; i < MEMBER_COMBO.length; i++) {
      var combo = MEMBER_COMBO[i];
      if (referencesGlobal(callee.object, combo.object) && propName === combo.property) {
        problems.push({
          line: callee.loc.start.line,
          message: "'" + combo.object + "." + combo.property + "' is not available on this TV's engine"
        });
      }
    }
  });

  return problems;
}

module.exports = { checkJs: checkJs };
