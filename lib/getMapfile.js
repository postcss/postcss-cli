'use strict'
const path = require('path')

module.exports = function getMapfile(p) {
  return p.replace(path.extname(p), `${path.extname(p)}.map`)
}
