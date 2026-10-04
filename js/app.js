/* Breakout: the shared namespace every script hangs off. */
(function (root) {
  "use strict";
  var BO = root.BO || {};
  root.BO = BO;
  if (typeof module !== "undefined" && module.exports) { module.exports = BO; }
})(typeof window !== "undefined" ? window : this);
