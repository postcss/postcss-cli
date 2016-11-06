var async = require('neo-async')
var writeFile = require('./write-file')

function writeResult (name, content, argv, fn) {
  var funcs = [
    async.apply(writeFile, name, content.css, argv)
  ]
  if (content.map && name) {
    funcs.push(async.apply(writeFile, name + '.map', content.map.toString(), argv))
  }
  async.parallel(funcs, fn)
}

module.exports = writeResult
