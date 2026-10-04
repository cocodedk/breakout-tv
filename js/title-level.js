/* Breakout title level: the level the player picks on the title page. It is read from storage once, when
   the app starts, then kept in the session and saved whenever it changes. */
(function (BO) {
  "use strict";
  var levels = BO.levels || require("./levels.js");
  var KEY = "breakout.level";

  /* The level a saved text stands for: a whole number from 1 to the last level, else 1. */
  function parse(raw) {
    var n = Number(raw);
    return n === Math.floor(n) && n >= 1 && n <= levels.COUNT ? n : 1;
  }

  function load() {
    BO.session.chosenLevel = parse(BO.store.get(KEY));
  }

  /* One level down (-1) or up (1), stopping at the ends. */
  function move(delta) {
    var g = BO.session;
    var next = Math.max(1, Math.min(levels.COUNT, g.chosenLevel + delta));
    if (next === g.chosenLevel) { return; }
    g.chosenLevel = next;
    BO.store.set(KEY, String(next));
    BO.hud.showLevel();
  }

  BO.titleLevel = { parse: parse, load: load, move: move };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.titleLevel; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
