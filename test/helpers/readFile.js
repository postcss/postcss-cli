const fs = require('fs-promise')

module.exports = function (path) {
  return fs.readFile(path, 'utf8')
}
