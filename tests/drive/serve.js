/* Breakout drive helper: serves the app's own files over plain HTTP for Playwright. */
"use strict";
var http = require("http");
var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..", "..");
var HOST = "127.0.0.1";

var TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png"
};

function serve() {
  return new Promise(function (resolve, reject) {
    var server = http.createServer(function (req, res) {
      var reqPath = req.url.split("?")[0];
      if (reqPath === "/") { reqPath = "/index.html"; }
      var filePath = path.join(ROOT, reqPath);
      if (filePath.indexOf(ROOT) !== 0) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(filePath, function (err, data) {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        var ext = path.extname(filePath);
        res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" });
        res.end(data);
      });
    });

    server.once("error", reject);
    server.listen(0, HOST, function () {
      resolve({
        url: "http://" + HOST + ":" + server.address().port,
        close: function () {
          return new Promise(function (res) {
            server.close(function () { res(); });
          });
        }
      });
    });
  });
}

module.exports = { serve: serve };
