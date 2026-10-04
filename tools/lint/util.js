"use strict";

// Shared line-number bookkeeping for the CSS and HTML checkers. The JS checker
// does not need this: acorn already reports line numbers on every node.

function computeLineStarts(text) {
  var starts = [0];
  for (var i = 0; i < text.length; i++) {
    if (text[i] === "\n") { starts.push(i + 1); }
  }
  return starts;
}

function lineAt(lineStarts, offset) {
  var line = 1;
  for (var i = 0; i < lineStarts.length; i++) {
    if (lineStarts[i] <= offset) { line = i + 1; } else { break; }
  }
  return line;
}

module.exports = { computeLineStarts: computeLineStarts, lineAt: lineAt };
