module.exports = {
  use: "postcss-url",
  input: "**/in.css",
  inputContext: "test",
  dir: "test/build",
  "postcss-url": {
    url: function(url) { return "http://example.com/" + url; }
  }
};
