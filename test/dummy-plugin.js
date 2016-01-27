var postcss = require('postcss');

module.exports = postcss.plugin('dummy-plugin', function(opts) {
  opts = opts || {};

  return function (css, result) {
    // throw something so that we can test error messages
    if (css.nodes[0].selector === 'a') {
      throw css.nodes[0].error('Dummy error');
    }
    if (css.nodes[0].selector === 'figure') {
    	result.warn('Dummy warning', { node: css.nodes[0] });
    }
  };
});
