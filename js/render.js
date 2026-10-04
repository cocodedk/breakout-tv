/* Breakout canvas: draws the bricks, the core, the paddle and the ball. */
(function (BO) {
  "use strict";
  var BACKGROUND = "#070b1e";
  var SILVER_HIT = "#7d869a";
  var RADIUS = 6;
  var GLOW_R = 44;
  var physics = BO.physics;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function disc(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function brickColor(b) {
    return b.color === "S" && b.hits === 1 ? SILVER_HIT : BO.levels.COLORS[b.color];
  }

  /* While the wall dissolves, `fade` runs from 0 to 1: each brick loses opacity and shrinks to no
     height about its own centre line. Without a dissolve it is null. */
  function drawBrick(ctx, b, fade) {
    var h = b.h * (1 - (fade || 0));
    if (h <= 0) { return; }
    ctx.globalAlpha = 1 - (fade || 0);
    ctx.fillStyle = brickColor(b);
    roundRect(ctx, b.x, b.y + (b.h - h) / 2, b.w, h, Math.min(RADIUS, h / 2));
    ctx.globalAlpha = 1;
  }

  function drawCore(ctx, core) {
    disc(ctx, core.x, BO.core.Y, GLOW_R, "rgba(255, 212, 71, 0.25)");
    disc(ctx, core.x, BO.core.Y, BO.core.R, "#ffd447");
    disc(ctx, core.x, BO.core.Y, BO.core.R / 2, "#fff1b0");
  }

  /* Paints the whole playfield from the physics state. */
  function draw(ctx, s, fade) {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, physics.W, physics.H);
    s.bricks.forEach(function (b) { drawBrick(ctx, b, fade); });
    drawCore(ctx, s.core);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, s.paddleX, physics.PADDLE_Y, physics.PADDLE_W, physics.PADDLE_H, RADIUS);
    if (!s.ballGone) { disc(ctx, s.ball.x, s.ball.y, physics.BALL_R, "#ffffff"); }
  }

  BO.render = { draw: draw };
})(window.BO);
