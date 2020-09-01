'use strict'
const test = require('ava')

const fs = require('fs-extra')
const path = require('path')

const cli = require('./helpers/cli.js')
const tmp = require('./helpers/tmp.js')

test('--ext works', async (t) => {
  const dir = tmp()

  const { error, stderr } = await cli([
    'test/fixtures/a.sss',
    '--parser',
    'sugarss',
    '-d',
    dir,
    '--ext',
    '.css',
  ])
  t.falsy(error, stderr)

  t.truthy(await fs.pathExists(path.join(dir, 'a.css')))
})
