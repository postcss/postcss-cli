module.exports = {
  use: "postcss-url",
  input: "test/in.css",
  output: "test/build/js-config-all.css",
  "postcss-url": {
    url: function(url) { return "http://example.com/" + url; }
  }
};
