'use strict'

const path = require('path')
const uuid = require('uuid')

module.exports = (ext) => {
  ext = ext || ''

  return path.join('test/fixtures/.tmp', uuid(), ext)
}
