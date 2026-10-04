"use strict";

var util = require("./util");
var jsCheck = require("./js-check");
var cssCheck = require("./css-check");

var RAW_TEXT_TAGS = new Set(["script", "style"]);
var TEXT_ONLY_TAGS = new Set(["title", "textarea"]);

// Parses one tag's attributes starting right after the tag name (e.g. right
// after "<script"), respecting quoted attribute values that may contain '>'.
// A stray '/' not immediately before '>' (as in "<script / >") is consumed
// like any other character, so the cursor always advances: this used to
// hang, since an unmatched '/' matched neither the self-close check nor the
// attribute-name scan (attribute names exclude '/'), leaving i frozen.
function parseAttributes(html, start) {
  var attrs = [];
  var i = start;
  var n = html.length;
  while (i < n) {
    while (i < n && /\s/.test(html[i])) { i++; }
    if (html[i] === ">") { i++; break; }
    if (html[i] === "/") {
      if (html[i + 1] === ">") { i += 2; break; }
      i++;
      continue;
    }
    if (i >= n) { break; }

    var nameStart = i;
    while (i < n && !/[\s=\/>]/.test(html[i])) { i++; }
    var name = html.slice(nameStart, i).toLowerCase();
    if (!name) { i++; continue; }

    var value = null;
    var valueOffset = -1;
    while (i < n && /\s/.test(html[i])) { i++; }
    if (html[i] === "=") {
      i++;
      while (i < n && /\s/.test(html[i])) { i++; }
      var quote = html[i];
      if (quote === '"' || quote === "'") {
        i++;
        valueOffset = i;
        var qStart = i;
        while (i < n && html[i] !== quote) { i++; }
        value = html.slice(qStart, i);
        if (i < n) { i++; }
      } else {
        valueOffset = i;
        var uStart = i;
        while (i < n && !/[\s>]/.test(html[i])) { i++; }
        value = html.slice(uStart, i);
      }
    }
    attrs.push({ name: name, value: value, valueOffset: valueOffset });
  }
  return { attrs: attrs, end: i };
}

function hasAttr(attrs, name) {
  return attrs.some(function (a) { return a.name === name; });
}

var NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

// An attribute value is HTML-encoded text (e.g. `&amp;&amp;` for `&&`), and
// a browser decodes it before treating it as CSS or JS, so it must be
// decoded here too or a plain "&&" written as an entity looks like invalid
// syntax.
function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, function (match, body) {
    if (body[0] === "#") {
      var isHex = body[1] === "x" || body[1] === "X";
      var codePoint = parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (isNaN(codePoint) || codePoint < 0 || codePoint > 0x10ffff) { return match; }
      return String.fromCodePoint(codePoint);
    }
    return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, body) ? NAMED_ENTITIES[body] : match;
  });
}

// An inline `style="..."` or `on*="..."` attribute is real CSS/JS, checked
// at its own source offset regardless of which element it sits on. A real
// inline handler runs as the body of an implicit function (the HTML living
// standard wraps it as `function (event) { ...the attribute text... }`), so
// a bare `return` (or a labeled `break`/`continue`) is legal there, even
// though it is a syntax error at a plain script's top level.
function collectAttributeBlocks(attrs, blocks) {
  attrs.forEach(function (attr) {
    if (attr.value === null) { return; }
    if (attr.name === "style") {
      blocks.push({ type: "css", code: "*{" + decodeEntities(attr.value) + "}", offset: attr.valueOffset });
    } else if (/^on[a-z]/.test(attr.name)) {
      // The trailing newline before the closing "})" keeps a `//` line
      // comment in the handler's own code from swallowing the wrapper.
      blocks.push({ type: "js", code: "(function () {" + decodeEntities(attr.value) + "\n})", offset: attr.valueOffset });
    }
  });
}

// A minimal HTML tokenizer: skips comments whole, tokenizes every tag's
// attributes (so quoted attribute text, such as a title="<style>..." value,
// is never mistaken for real markup), and treats <script>/<style>/<title>/
// <textarea> content as opaque text up to their real closing tag.
function extractBlocks(html) {
  var blocks = [];
  var i = 0;
  var n = html.length;
  while (i < n) {
    if (html.slice(i, i + 4) === "<!--") {
      var commentEnd = html.indexOf("-->", i + 4);
      i = commentEnd === -1 ? n : commentEnd + 3;
      continue;
    }
    if (html[i] !== "<") { i++; continue; }
    if (html[i + 1] === "/") {
      var closeEnd = html.indexOf(">", i + 2);
      i = closeEnd === -1 ? n : closeEnd + 1;
      continue;
    }
    var nameMatch = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(html.slice(i, i + 40));
    if (!nameMatch) { i++; continue; }

    var tagName = nameMatch[1].toLowerCase();
    var tag = parseAttributes(html, i + nameMatch[0].length);
    collectAttributeBlocks(tag.attrs, blocks);

    if (RAW_TEXT_TAGS.has(tagName) || TEXT_ONLY_TAGS.has(tagName)) {
      var contentStart = tag.end;
      var closeRe = new RegExp("</" + tagName + "\\s*>", "i");
      var rest = html.slice(contentStart);
      var closeMatch = closeRe.exec(rest);
      var content = closeMatch ? rest.slice(0, closeMatch.index) : rest;
      i = closeMatch ? contentStart + closeMatch.index + closeMatch[0].length : n;

      if (tagName === "script" && !hasAttr(tag.attrs, "src")) {
        blocks.push({ type: "js", code: content, offset: contentStart });
      } else if (tagName === "style") {
        blocks.push({ type: "css", code: content, offset: contentStart });
      }
      continue;
    }

    i = tag.end;
  }
  return blocks;
}

function checkHtml(source) {
  var problems = [];
  var lineStarts = util.computeLineStarts(source);
  var blocks = extractBlocks(source);
  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    var baseLine = util.lineAt(lineStarts, block.offset) - 1;
    var inner = block.type === "js" ? jsCheck.checkJs(block.code) : cssCheck.checkCss(block.code);
    for (var j = 0; j < inner.length; j++) {
      problems.push({ line: baseLine + inner[j].line, message: inner[j].message });
    }
  }
  return problems;
}

module.exports = { checkHtml: checkHtml, parseAttributes: parseAttributes };
