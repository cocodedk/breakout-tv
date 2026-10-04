/* Breakout storage: localStorage that never throws, so the game runs without it. */
(function (BO) {
  "use strict";
  BO.store = {
    get: function (key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) { /* no storage: nothing is kept */ }
    }
  };
})(window.BO);
