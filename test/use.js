import test from 'ava'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

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
