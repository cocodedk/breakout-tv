"use strict";
var chromium = require("playwright").chromium;
var serve = require("./serve.js").serve;

async function closeQuietly(closeable) {
  if (!closeable) { return; }
  try { await closeable.close(); } catch (e) { /* teardown must not stop on a failed close */ }
}

/* Boots a served app and a browser for one drive file, hands them to fn(browser, url), and tears
   both down afterwards even when fn throws. */
async function runDrive(fn) {
  var served = await serve();
  try {
    var browser = await chromium.launch();
    try {
      await fn(browser, served.url);
    } finally {
      await closeQuietly(browser);
    }
  } finally {
    await closeQuietly(served);
  }
}

module.exports = { closeQuietly: closeQuietly, runDrive: runDrive };
