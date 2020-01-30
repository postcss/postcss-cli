const path = require('path')
const uuid = require('uuid')

module.exports = function(ext) {
  ext = ext || ''

  return path.join('test/fixtures/.tmp', uuid(), ext)
}
