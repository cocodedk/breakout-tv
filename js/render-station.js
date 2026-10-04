/* Breakout canvas: draws the battle station and the bolts, on render.js's helpers. Plain fills, one clip. */
(function (BO) {
  "use strict";
  var render = BO.render;
  var st = BO.station;
  var TWO_PI = Math.PI * 2;
  var HULL = "#8a93a6";
  var PANEL = "#5b6378";
  var TRENCH = "#3b4152";
  var DISH_INNER = "#6f788c";
  var GREEN = "#4be38e";
  var GOLD = "#ffd447";
  var TRENCH_H = 10;
  var LINE_H = 2;
  var LINES = [95, 185, 215];
  var DISH_R = 26;
  var DISH_INNER_R = 14;
  var CHARGE_R = 6;

  /* A band across the whole disc, centred on y. */
  function band(ctx, station, y, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(station.x - station.r, y - height / 2, station.r * 2, height);
  }

  /* The hull, its darker lower half, the trench and panel lines (clipped to the disc), the dish and,
     while charging, the green dot that shows a shot is coming. */
  function station(ctx, s, charging) {
    render.disc(ctx, s.x, s.y, s.r, HULL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, TWO_PI);
    ctx.clip();
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    band(ctx, s, s.y, TRENCH_H, TRENCH);
    LINES.forEach(function (y) { band(ctx, s, y, LINE_H, PANEL); });
    ctx.restore();
    render.disc(ctx, st.DISH_X, st.DISH_Y, DISH_R, PANEL);
    render.disc(ctx, st.DISH_X, st.DISH_Y, DISH_INNER_R, DISH_INNER);
    if (charging) { render.disc(ctx, st.DISH_X, st.DISH_Y, CHARGE_R, GREEN); }
  }

  /* Each bolt is a 6x28 rounded bar turned to lie along its direction of travel: green going down,
     gold once returned. */
  function bolts(ctx, list) {
    list.forEach(function (b) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(-b.vx, b.vy));
      ctx.fillStyle = b.back ? GOLD : GREEN;
      render.roundRect(ctx, -st.BOLT_W / 2, -st.BOLT_H / 2, st.BOLT_W, st.BOLT_H, st.BOLT_W / 2);
      ctx.restore();
    });
  }

  render.station = station;
  render.bolts = bolts;
})(window.BO);
