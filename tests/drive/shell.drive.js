/* Breakout drive: the app loads at 1920x1080 with its title and build stamp, and logs no errors. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;

runDrive(async function (browser, url) {
  var page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  var errors = [];
  page.on("pageerror", function (e) { errors.push(String(e)); });
  page.on("console", function (m) { if (m.type() === "error") { errors.push(m.text()); } });
  await page.goto(url);
  assert.ok(await page.isVisible("#title-name"), "the title is visible");
  assert.ok(await page.isVisible("#build-stamp"), "the build stamp is visible");
  assert.deepStrictEqual(errors, []);
  console.log("shell drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
