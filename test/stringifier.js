import test from 'ava'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('--stringifier works', async (t) => {
  const output = tmp('output.sss')

  const { error, stderr } = await cli([
    'test/fixtures/a.css',
    '--stringifier',
    'sugarss',
    '-o',
    output,
    '--no-map',
  ])

  t.falsy(error, stderr)

  t.is(await read(output), await read('test/fixtures/a.sss'))
})
