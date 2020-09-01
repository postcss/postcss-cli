'use strict'
const fs = require('fs-extra')
const path = require('path')
const globby = require('globby')

const tmp = require('./tmp.js')

module.exports = function (config, fixtures) {
  fixtures = fixtures || '**/*'
  const dir = tmp()

  return Promise.all([
    globby(fixtures, { cwd: 'test/fixtures' }).then((list) => {
      return list.map((item) => {
        return fs.copy(path.join('test/fixtures', item), path.join(dir, item))
      })
    }),
    fs.outputFile(path.join(dir, 'postcss.config.js'), config),
  ]).then(() => dir)
}
