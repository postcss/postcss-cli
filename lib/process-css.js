var async = require('neo-async')
var readFile = require('read-file-stdin')
var writeResult = require('./write-result')

function processCSS (processor, input, output, argv, fn) {
  var customSyntaxOptions = ['syntax', 'parser', 'stringifier']
    .reduce(function(cso, opt) {
      if (argv[opt]) {
        cso[opt] = require(argv[opt]);
      }
      return cso;
    }, Object.create(null));
  function doProcess(css, fn) {
    function onResult(result) {
      if (typeof result.warnings === 'function') {
        result.warnings().forEach(function(w) { console.warn(w.toString()); });
      }
      fn(null, result);
    }

    var options = {
      from: input,
      to: output
    };

    Object.keys(customSyntaxOptions).forEach(function(opt) {
      options[opt] = customSyntaxOptions[opt];
    });

    if (typeof mapOptions !== 'undefined') {
      options.map = mapOptions;
    }

    var result = processor.process(css, options);

    if (typeof result.then === 'function') {
      result.then(onResult).catch(fn);
    } else {
      process.nextTick(onResult.bind(null, result));
    }
  }

  async.waterfall([
    async.apply(readFile, input),
    doProcess,
    async.apply(writeResult, output, argv)
  ], fn);
}

module.exports = processCSS
