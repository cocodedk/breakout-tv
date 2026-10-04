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

  /* `fade` runs from 0 to 1 while the wall dissolves: each brick shrinks to no height about its own
     centre line. */
  function drawBrick(ctx, b, fade) {
    var h = b.h * (1 - fade);
    if (h <= 0) { return; }
    ctx.fillStyle = brickColor(b);
    roundRect(ctx, b.x, b.y + (b.h - h) / 2, b.w, h, Math.min(RADIUS, h / 2));
  }

  /* All the bricks lose opacity together as they fade, so it is set once for the whole wall. */
  function drawBricks(ctx, bricks, fade) {
    if (fade > 0) { ctx.globalAlpha = 1 - fade; }
    bricks.forEach(function (b) { drawBrick(ctx, b, fade); });
    if (fade > 0) { ctx.globalAlpha = 1; }
  }

  function drawCore(ctx, core) {
    disc(ctx, core.x, BO.core.Y, GLOW_R, "rgba(255, 212, 71, 0.25)");
    disc(ctx, core.x, BO.core.Y, BO.core.R, "#ffd447");
    disc(ctx, core.x, BO.core.Y, BO.core.R / 2, "#fff1b0");
  }

  /* Paints the whole playfield from the physics state and the view: { fade, ballHidden }. */
  function draw(ctx, s, view) {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, physics.W, physics.H);
    drawBricks(ctx, s.bricks, view.fade);
    drawCore(ctx, s.core);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, s.paddleX, physics.PADDLE_Y, physics.PADDLE_W, physics.PADDLE_H, RADIUS);
    if (!view.ballHidden) { disc(ctx, s.ball.x, s.ball.y, physics.BALL_R, "#ffffff"); }
  }

  BO.render = { draw: draw };
})(window.BO);
