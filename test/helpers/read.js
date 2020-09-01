'use strict'
const { readFile } = require('fs-extra')

module.exports = function (path) {
  return readFile(path, 'utf8').then(
    (content) => content.replace(/\r\n/g, '\n') // normalize line endings on Windows
  )
}
