module.exports = function(opts) {
  opts = opts || {};

  return function (css) {
    // throw something so that we can test error messages
    if (css.nodes[0].selector === 'a') {
      throw css.nodes[0].error('Dummy error');
    }
  };
};

module.exports.postcss = function (css) {
  return module.exports()(css);
};
