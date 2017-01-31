'use strict'

const fs = require('fs-promise')
const path = require('path')
const globby = require('globby')

const tmp = require('./tmp.js')

module.exports = function (conf, fixtures) {
  fixtures = fixtures || '**/*'
  // fixtures = fixtures.map(p => path.join('test/fixtures', p))
  const dir = tmp()
  // Save promise in a const
  const fixture = globby(fixtures, { cwd: 'test/fixtures' })
    .then((list) => {
      return list.map((item) => {
        return fs.copy(path.join('test/fixtures', item), path.join(dir, item))
      })
    })
  // Save promise in a const
  const config = fs.outputFile(path.join(dir, 'postcss.config.js'), conf)
  // Return a promise for dir when both tasks are done:
  return Promise.all([ fixture, config ]).then(() => dir)
}
