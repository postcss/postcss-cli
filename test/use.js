'use strict'
const test = require('ava')

const cli = require('./helpers/cli.js')
const tmp = require('./helpers/tmp.js')
const read = require('./helpers/read.js')

test('--use works', async (t) => {
  const output = tmp('i.css')

  const { error, stderr } = await cli([
    'test/fixtures/import.css',
    '-u',
    'postcss-import',
    '-o',
    output,
    '--no-map',
  ])

  t.falsy(error, stderr)

  t.is(await read(output), await read('test/fixtures/a.css'))
})
