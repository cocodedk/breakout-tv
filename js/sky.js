/* Breakout sky: the deep-space backdrop, drawn once when the app starts. */
(function (BO) {
  "use strict";
  var W = 1920;
  var H = 1080;
  var BACKGROUND = "#070b1e";
  var STAR_COUNT = 220;
  var SEED = 7;

  /* Nebula clouds: centre x, centre y, radius, colour, and the same colour fully see-through. */
  var NEBULAE = [
    [420, 260, 520, "rgba(124, 77, 255, 0.18)", "rgba(124, 77, 255, 0)"],
    [1500, 360, 600, "rgba(90, 169, 255, 0.14)", "rgba(90, 169, 255, 0)"],
    [980, 900, 480, "rgba(255, 90, 200, 0.10)", "rgba(255, 90, 200, 0)"]
  ];

  var drawn = 0;

  /* A small seeded generator, so the sky is the same on every run. */
  function mulberry32(seed) {
    var a = seed;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Every 10th star is pale blue and every 15th pale gold; a star that is both takes the blue. */
  function starColor(n) {
    if (n % 10 === 0) { return "#cfe3ff"; }
    return n % 15 === 0 ? "#ffe9c4" : "#ffffff";
  }

  /* The stars as { x, y, r, opacity, color }, the same list on every call. */
  function stars() {
    var random = mulberry32(SEED);
    var list = [];
    for (var i = 1; i <= STAR_COUNT; i++) {
      list.push({ x: random() * W, y: random() * H, r: 0.6 + random() * 1.2,
        opacity: 0.3 + random() * 0.7, color: starColor(i) });
    }
    return list;
  }

  function drawNebula(ctx, n) {
    var g = ctx.createRadialGradient(n[0], n[1], 0, n[0], n[1], n[2]);
    g.addColorStop(0, n[3]);
    g.addColorStop(1, n[4]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStar(ctx, s) {
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw(ctx) {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, W, H);
    NEBULAE.forEach(function (n) { drawNebula(ctx, n); });
    stars().forEach(function (s) { drawStar(ctx, s); });
    ctx.globalAlpha = 1;
    drawn += 1;
  }

  /* Draws the sky on the page's #sky canvas, once. */
  function start() {
    var canvas = document.getElementById("sky");
    if (canvas && canvas.getContext) { draw(canvas.getContext("2d")); }
  }

  BO.sky = { stars: stars, draw: draw, start: start, draws: function () { return drawn; } };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.sky; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
