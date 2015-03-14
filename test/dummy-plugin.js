module.exports = function (opts) {
    opts = opts || {};

    return function (css) {
    };
};

module.exports.postcss = function (css) {
    return module.exports()(css);
};
