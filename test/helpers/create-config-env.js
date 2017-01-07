const fs = require('fs-promise')
const path = require('path')
const globby = require('globby')
const tmp = require('./get-tmp.js')

module.exports = function (conf, fixtures) {
  if (!fixtures) fixtures = '**/*'
  // fixtures = fixtures.map(p => path.join('test/fixtures', p))
  var dir = tmp()
  // Save promise in a var
  var fixtureCopy = globby(fixtures, {cwd: 'test/fixtures'})
  .then(list => {
    return list.map(item => {
      return fs.copy(path.join('test/fixtures', item), path.join(dir, item))
    })
  })
  // Save promise in a var
  var confWrite = fs.outputFile(path.join(dir, 'postcss.config.js'), conf)
  // Return a promise for dir when both tasks are done:
  return Promise.all([fixtureCopy, confWrite]).then(() => dir)
}
