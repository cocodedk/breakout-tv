/* Breakout: copies the app's own files into dist/app/ and stamps the build in the corner with the
   version, the commit and the time, so the TV shows which commit is running. Run it, then package
   dist/app as profile-tizen.md describes. */
var fs = require("fs");
var path = require("path");
var cp = require("child_process");

var root = path.join(__dirname, "..");
var out = path.join(root, "dist", "app");
var FILES = ["config.xml", "index.html", "icon.png", "css", "js"];

function git(args) {
  return cp.execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function stampText() {
  var version = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
  var dirty = git(["status", "--porcelain", "--untracked-files=no"]) ? "+" : "";
  var when = new Date().toISOString().slice(0, 16).replace("T", " ");
  return "Build " + version + " · " + git(["rev-parse", "--short", "HEAD"]) + dirty + " · " + when;
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
FILES.forEach(function (name) {
  fs.cpSync(path.join(root, name), path.join(out, name), { recursive: true });
});

var page = path.join(out, "index.html");
var html = fs.readFileSync(page, "utf8");
var pattern = /(<div id="build-stamp">)[^<]*(<\/div>)/;
if (!pattern.test(html)) {
  throw new Error("index.html has no build stamp to fill in");
}
var text = stampText();
fs.writeFileSync(page, html.replace(pattern, function (all, open, close) { return open + text + close; }));
console.log("Staged dist/app with stamp: " + text);
