'use strict'
const test = require('ava')

const fs = require('fs-extra')
const path = require('path')

const cli = require('./helpers/cli.js')
const tmp = require('./helpers/tmp.js')
const read = require('./helpers/read.js')

test('--replace works', async (t) => {
  const dir = tmp()

  const output = path.join(dir, 'output.css')

  await Promise.all([
    fs.copy('test/fixtures/import.css', output),
    fs.copy('test/fixtures/a.css', path.join(dir, 'a.css')),
  ])

  const { error, stderr } = await cli([
    output.replace(/\\/g, '/'), // gotta keep globby happy on Windows
    '--replace',
    '-u',
    'postcss-import',
    '--no-map',
  ])

  t.falsy(error, stderr)

  t.is(await read(output), await read('test/fixtures/a.css'))
})
