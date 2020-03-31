const test = require('ava')

const cli = require('./helpers/cli.js')
const tmp = require('./helpers/tmp.js')
const read = require('./helpers/read.js')

test('--syntax works', async (t) => {
  const output = tmp('output.sss')

  const { error, stderr } = await cli([
    'test/fixtures/a.sss',
    '--syntax',
    'sugarss',
    '-o',
    output,
    '--no-map',
  ])

  t.falsy(error, stderr)

  t.is(await read(output), await read('test/fixtures/a.sss'))
})
