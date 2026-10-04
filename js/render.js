/* Breakout canvas: draws the bricks, the paddle and the ball. */
(function (BO) {
  "use strict";
  var BACKGROUND = "#070b1e";
  var SILVER_HIT = "#7d869a";
  var RADIUS = 6;
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

  function brickColor(b) {
    return b.color === "S" && b.hits === 1 ? SILVER_HIT : BO.levels.COLORS[b.color];
  }

  /* Paints the whole playfield from the physics state. */
  function draw(ctx, s) {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, physics.W, physics.H);
    s.bricks.forEach(function (b) {
      ctx.fillStyle = brickColor(b);
      roundRect(ctx, b.x, b.y, b.w, b.h, RADIUS);
    });
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, s.paddleX, physics.PADDLE_Y, physics.PADDLE_W, physics.PADDLE_H, RADIUS);
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, physics.BALL_R, 0, Math.PI * 2);
    ctx.fill();
  }

  BO.render = { draw: draw };
})(window.BO);
