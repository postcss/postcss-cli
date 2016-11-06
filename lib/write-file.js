var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')

function writeFile (name, log, content, argv, fn) {
  if (!name) {
    process.stdout.write(content)
    return fn()
  }

  mkdirp(path.dirname(name), function (err) {
    if (err) {
      fn(err)
    } else {
      fs.writeFile(name, content, fn)

      if (argv.log) {
        console.log('Generated file: ' + name)
      }
    }
  })
}

module.exports = writeFile
