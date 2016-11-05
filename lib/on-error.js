function onError (err, keepAlive) {
  if (err) {
    if (err.message && typeof err.showSourceCode === 'function') {
      console.error(err.message, err.showSourceCode());
    } else {
      console.error(err);
    }
    if (!keepAlive) {
      process.exit(1);
    }
  }
}

module.exports = onError
