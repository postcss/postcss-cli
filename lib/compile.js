var path = require('path')
var processCSS = require('./process-css')

function compile (input, processor, argv, fn) {
  var output = argv.output

  if (argv.dir) {
    output = path.join(argv.dir, path.basename(input))
  } else if (argv.replace) {
    output = input
  }

  processCSS(processor, input, output, argv, fn)
}

module.exports = compile
