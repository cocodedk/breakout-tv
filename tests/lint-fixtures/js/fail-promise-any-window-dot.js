function race(promises) {
  return window.Promise.any(promises);
}
