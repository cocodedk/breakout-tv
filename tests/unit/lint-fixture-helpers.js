"use strict";

var fs = require("fs");
var path = require("path");

function loadFixture(dir, name) {
  return fs.readFileSync(path.join(dir, name), "utf8");
}

// Every fixture file in dir, split by its fail-/pass- prefix.
function listFixtures(dir) {
  var all = fs.readdirSync(dir);
  return {
    fail: all.filter(function (f) { return f.indexOf("fail-") === 0; }),
    pass: all.filter(function (f) { return f.indexOf("pass-") === 0; })
  };
}

module.exports = { loadFixture: loadFixture, listFixtures: listFixtures };
