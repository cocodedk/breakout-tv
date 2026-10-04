/* Breakout held keys: which way the paddle is being pushed, from keydown and keyup times. No DOM. */
(function (BO) {
  "use strict";
  var NO_KEYUP_MS = 600;

  /* A model of the move keys. `key` is any id for a physical key, `dir` is -1 or 1, `t` is in ms. */
  function create() {
    var held = [];
    var seenKeyup = false;

    function indexOf(key) {
      for (var i = 0; i < held.length; i++) {
        if (held[i].key === key) { return i; }
      }
      return -1;
    }

    /* A remote that never sends keyup: until one is seen, a key ends 600 ms after its last keydown. */
    function expire(t) {
      if (seenKeyup) { return; }
      held = held.filter(function (k) { return t - k.t < NO_KEYUP_MS; });
    }

    return {
      down: function (key, dir, t) {
        expire(t);
        var i = indexOf(key);
        if (i < 0) { held.push({ key: key, dir: dir, t: t }); } else { held[i].t = t; }
      },
      up: function (key) {
        seenKeyup = true;
        var i = indexOf(key);
        if (i >= 0) { held.splice(i, 1); }
      },
      release: function () { held = []; },
      /* -1, 0 or 1: the key pressed last that is still held wins. */
      dir: function (t) {
        expire(t);
        return held.length ? held[held.length - 1].dir : 0;
      }
    };
  }

  BO.hold = { NO_KEYUP_MS: NO_KEYUP_MS, create: create };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.hold; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
