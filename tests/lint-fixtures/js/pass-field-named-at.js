function tone(at, length) {
  return { at: at, length: length };
}
var t = tone(0.5, 0.2);
var startTime = t.at;
t.at = 0.75;
