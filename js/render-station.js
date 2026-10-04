/* Breakout canvas: draws the battle station and the bolts, on render.js's helpers. Plain fills, one clip. */
(function (BO) {
  "use strict";
  var render = BO.render;
  var st = BO.station;
  var TWO_PI = Math.PI * 2;
  var RIM = "#c9d0dd";
  var HULL = "#8a93a6";
  var PANEL = "#5b6378";
  var TRENCH = "#3b4152";
  var DISH_SHADOW = "#454c5e";
  var DISH_INNER = "#6f788c";
  var GREEN = "#4be38e";
  var GOLD = "#ffd447";
  var TRENCH_H = 10;
  var LINE_H = 2;
  var LINES = [95, 185, 215];
  var DISH_R = 26;
  var DISH_INNER_R = 15;
  var CHARGE_R = 6;
  /* Light falls from the upper left: each shade is the disc again, shifted down and right. */
  var SHADES = [[30, "rgba(0, 0, 0, 0.11)"], [55, "rgba(0, 0, 0, 0.11)"], [80, "rgba(0, 0, 0, 0.11)"]];
  /* Small surface panels, [dx, dy, width, height] from the centre, clear of the dish and trench. */
  var PANELS = [[-70, -55, 14, 4], [-40, -70, 10, 3], [-10, -82, 16, 4], [-85, -20, 12, 4],
    [-55, -30, 8, 3], [10, -60, 10, 3], [-75, 20, 16, 4], [-35, 30, 10, 3], [5, 22, 14, 4],
    [45, 30, 12, 3], [70, 15, 10, 4], [-50, 60, 14, 4], [-5, 65, 10, 3], [35, 58, 16, 4]];
  var GLOW = { green: "rgba(75, 227, 142, 0.3)", gold: "rgba(255, 212, 71, 0.3)" };

  /* A band across the whole disc, centred on y. */
  function band(ctx, station, y, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(station.x - station.r, y - height / 2, station.r * 2, height);
  }

  /* The surface inside the clip: shading, the trench with its lit lower lip, panel lines and panels. */
  function surface(ctx, s) {
    SHADES.forEach(function (shade) {
      render.disc(ctx, s.x + shade[0], s.y + shade[0], s.r, shade[1]);
    });
    band(ctx, s, s.y, TRENCH_H, TRENCH);
    band(ctx, s, s.y + TRENCH_H / 2 + 1, LINE_H, "rgba(255, 255, 255, 0.16)");
    LINES.forEach(function (y) { band(ctx, s, y, LINE_H, PANEL); });
    PANELS.forEach(function (p, i) {
      ctx.fillStyle = i % 2 ? "#9ca5b7" : "#7a8397";
      ctx.fillRect(s.x + p[0], s.y + p[1], p[2], p[3]);
    });
  }

  /* A recessed dish: a dark rim, a bowl lit on its lower right, the emitter in the middle and, while
     charging, a green glow that shows a shot is coming. */
  function dish(ctx, charging) {
    render.disc(ctx, st.DISH_X, st.DISH_Y, DISH_R, PANEL);
    render.disc(ctx, st.DISH_X, st.DISH_Y, DISH_INNER_R + 2, DISH_SHADOW);
    render.disc(ctx, st.DISH_X + 2, st.DISH_Y + 2, DISH_INNER_R, DISH_INNER);
    render.disc(ctx, st.DISH_X, st.DISH_Y, 3, TRENCH);
    if (charging) {
      render.disc(ctx, st.DISH_X, st.DISH_Y, CHARGE_R * 2 + 2, GLOW.green);
      render.disc(ctx, st.DISH_X, st.DISH_Y, CHARGE_R, GREEN);
    }
  }

  /* A pale rim on the lit edge (the hull drawn over it, shifted down and right), the surface clipped
     to the disc, then the dish. */
  function station(ctx, s, charging) {
    render.disc(ctx, s.x, s.y, s.r, RIM);
    render.disc(ctx, s.x + 2, s.y + 2, s.r - 2, HULL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, TWO_PI);
    ctx.clip();
    surface(ctx, s);
    ctx.restore();
    dish(ctx, charging);
  }

  /* Each bolt is a 6x28 rounded bar in a soft glow, turned to lie along its direction of travel:
     green going down, gold once returned. */
  function bolts(ctx, list) {
    list.forEach(function (b) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(-b.vx, b.vy));
      ctx.fillStyle = b.back ? GLOW.gold : GLOW.green;
      render.roundRect(ctx, -st.BOLT_W / 2 - 4, -st.BOLT_H / 2 - 5, st.BOLT_W + 8, st.BOLT_H + 10, st.BOLT_W / 2 + 4);
      ctx.fillStyle = b.back ? GOLD : GREEN;
      render.roundRect(ctx, -st.BOLT_W / 2, -st.BOLT_H / 2, st.BOLT_W, st.BOLT_H, st.BOLT_W / 2);
      ctx.restore();
    });
  }

  render.station = station;
  render.bolts = bolts;
})(window.BO);
