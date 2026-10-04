/* Breakout sound: the UFO hit, four layers (zap, boom, thump, warble) on sound.js's context. */
(function (BO) {
  "use strict";
  var NOISE_SECONDS = 0.5;
  var noise = null;

  /* The boom's noise: one buffer of random samples, made once with the audio context. */
  function setup(ctx) {
    var length = Math.ceil(ctx.sampleRate * NOISE_SECONDS);
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = noise.getChannelData(0);
    for (var i = 0; i < length; i++) { data[i] = Math.random() * 2 - 1; }
  }

  function begin(source, start, end, track) {
    source.start(start);
    source.stop(end);
    track(source, end);
  }

  /* A tone falling from one pitch to another between start and end, at a peak gain. */
  function tone(ctx, track, wave, from, to, start, end, peak) {
    var osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.linearRampToValueAtTime(to, end);
    osc.connect(BO.sound.envelope(start, end, peak));
    begin(osc, start, end, track);
    return osc;
  }

  function boom(ctx, t, track) {
    var source = ctx.createBufferSource();
    var filter = ctx.createBiquadFilter();
    source.buffer = noise;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, t + 0.1);
    filter.frequency.linearRampToValueAtTime(200, t + 0.5);
    source.connect(filter);
    filter.connect(BO.sound.envelope(t + 0.1, t + 0.5, 0.25));
    begin(source, t + 0.1, t + 0.5, track);
  }

  /* The falling sine whose pitch wobbles by 40 Hz, twelve times a second, from an oscillator on its frequency. */
  function warble(ctx, t, track) {
    var osc = tone(ctx, track, "sine", 900, 300, t + 0.35, t + 0.95, 0.12);
    var wobble = ctx.createOscillator();
    var depth = ctx.createGain();
    wobble.frequency.setValueAtTime(12, t + 0.35);
    depth.gain.setValueAtTime(40, t + 0.35);
    wobble.connect(depth);
    depth.connect(osc.frequency);
    begin(wobble, t + 0.35, t + 0.95, track);
  }

  function play(ctx, t, track) {
    tone(ctx, track, "square", 1800, 200, t, t + 0.15, 0.15);
    boom(ctx, t, track);
    tone(ctx, track, "sine", 120, 40, t + 0.1, t + 0.4, 0.25);
    warble(ctx, t, track);
  }

  BO.sound.extend("core", { setup: setup, play: play });
})(window.BO);
