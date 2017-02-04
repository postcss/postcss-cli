'use strict'

import fs from 'fs-promise'
import path from 'path'
import globby from 'globby'

import tmp from './tmp.js'

export default function (config, fixtures) {
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
  const rc = fs.outputFile(
    path.join(dir, 'postcss.config.js'), config
  )
  // Return a promise for dir when both tasks are done:
  return Promise.all([ fixture, rc ]).then(() => dir)
}
