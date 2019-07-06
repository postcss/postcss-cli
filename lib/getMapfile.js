'use strict'
const path = require('path')

module.exports = function getMapfile(p) {
  const ext = path.extname(p)
  const base = path.basename(p)
  return p.replace(base, base.replace(ext, `${ext}.map`))
}
