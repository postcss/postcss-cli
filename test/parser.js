'use strict'
const test = require('ava')

const cli = require('./helpers/cli.js')
const tmp = require('./helpers/tmp.js')
const read = require('./helpers/read.js')

test('--parser works', async (t) => {
  const output = tmp('output.css')

  const { error, stderr } = await cli([
    'test/fixtures/a.sss',
    '--parser',
    'sugarss',
    '-o',
    output,
    '--no-map',
  ])

  t.falsy(error, stderr)

  t.is(await read(output), await read('test/fixtures/s.css'))
})
