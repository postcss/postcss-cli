module.exports = {
  use: ["postcss-import"],
  input: "test/import-index.css",
  output: "test/build/watch.css",
  "postcss-import": {
    onImport: function(sources) {
      global.watchCSS(sources);
    }
  }
};
