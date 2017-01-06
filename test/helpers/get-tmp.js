const path = require('path')
const uuid = require('uuid')
module.exports = (ext) => {
  if (!ext) ext = ''
  return path.join('test/fixtures/.tmp', uuid()) + ext
}
