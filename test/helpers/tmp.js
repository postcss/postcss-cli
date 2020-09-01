'use strict'
const path = require('path')
const { v4: uuid } = require('uuid')

module.exports = function (ext) {
  ext = ext || ''

  return path.join('test/fixtures/.tmp', uuid(), ext)
}
