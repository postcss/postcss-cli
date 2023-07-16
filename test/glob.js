import test from 'ava'
import path from 'path'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('works with glob patterns', async (t) => {
  const output = tmp()

  const { error, stderr } = await cli([
    'test/fixtures/glob/*.css',
    '-d',
    output,
    '--no-map',
  ])

  t.falsy(error, stderr)

  t.is(
    await read(path.join(output, 'a.css')),
    await read('test/fixtures/glob/a.css'),
  )
  t.is(
    await read(path.join(output, 'b.css')),
    await read('test/fixtures/glob/b.css'),
  )
  t.is(
    await read(path.join(output, 's.css')),
    await read('test/fixtures/glob/s.css'),
  )
})
