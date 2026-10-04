#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var jsCheck = require("./lint/js-check");
var cssCheck = require("./lint/css-check");
var htmlCheck = require("./lint/html-check");

var ROOT = path.join(__dirname, "..");

function walkDir(dir, extension, out) {
  var entries = fs.readdirSync(dir, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walkDir(full, extension, out); }
    else if (entry.name.slice(-extension.length) === extension) { out.push(full); }
  }
  return out;
}

function collectFiles() {
  var files = [{ path: path.join(ROOT, "index.html"), kind: "html" }];
  walkDir(path.join(ROOT, "css"), ".css", []).forEach(function (f) {
    files.push({ path: f, kind: "css" });
  });
  walkDir(path.join(ROOT, "js"), ".js", []).forEach(function (f) {
    files.push({ path: f, kind: "js" });
  });
  return files;
}

function main() {
  var files = collectFiles();
  var problems = [];

  files.forEach(function (file) {
    var source = fs.readFileSync(file.path, "utf8");
    var relPath = path.relative(ROOT, file.path);
    var found;
    if (file.kind === "html") { found = htmlCheck.checkHtml(source); }
    else if (file.kind === "css") { found = cssCheck.checkCss(source); }
    else { found = jsCheck.checkJs(source); }
    found.forEach(function (problem) {
      problems.push(relPath + ":" + problem.line + ": " + problem.message);
    });
  });

  if (problems.length > 0) {
    problems.forEach(function (line) { console.log(line); });
    process.exit(1);
  }
  process.exit(0);
}

main();
