"use strict";

// Consumes a quoted string starting at its opening quote (css[i] is ' or "),
// respecting backslash-escapes, and pushes its blanked contents (preserving
// newlines) to out. Returns the index right after the closing quote.
function consumeQuotedString(css, i, out, n) {
  var quote = css[i];
  out.push(" ");
  i++;
  while (i < n && css[i] !== quote) {
    if (css[i] === "\\") {
      out.push(" ", css[i + 1] === "\n" ? "\n" : " ");
      i += 2;
      continue;
    }
    out.push(css[i] === "\n" ? "\n" : " ");
    i++;
  }
  if (i < n) { out.push(" "); i++; }
  return i;
}

// Consumes a url(...) body from i (right after "url("), respecting quotes
// and backslash-escapes inside it, terminating only at an unquoted,
// unescaped ')'. Pushes blanked characters (preserving newlines) to out and
// returns the index right after the terminating ')'.
function consumeUrlBody(css, i, out, n) {
  while (i < n) {
    var c = css[i];
    if (c === "\\") {
      out.push(" ", css[i + 1] === "\n" ? "\n" : " ");
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      i = consumeQuotedString(css, i, out, n);
      continue;
    }
    if (c === ")") { out.push(")"); return i + 1; }
    out.push(c === "\n" ? "\n" : " ");
    i++;
  }
  return i;
}

// Blank out comments, string contents and url(...) contents, but keep every
// character position and newline (including escaped newlines inside strings),
// so line numbers computed later against the original source stay correct.
function stripCommentsAndStrings(css) {
  var out = [];
  var i = 0;
  var n = css.length;
  while (i < n) {
    var c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      out.push(" ", " ");
      i += 2;
      while (i < n && !(css[i] === "*" && css[i + 1] === "/")) {
        out.push(css[i] === "\n" ? "\n" : " ");
        i++;
      }
      if (i < n) { out.push(" ", " "); i += 2; }
    } else if (c === "'" || c === '"') {
      i = consumeQuotedString(css, i, out, n);
    } else if (css.slice(i, i + 4).toLowerCase() === "url(") {
      out.push("u", "r", "l", "(");
      i += 4;
      i = consumeUrlBody(css, i, out, n);
    } else {
      out.push(c);
      i++;
    }
  }
  return out.join("");
}

module.exports = { stripCommentsAndStrings: stripCommentsAndStrings };
