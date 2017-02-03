import test from 'ava'
import path from 'path'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('--dir works', async function (t) {
  const dir = tmp()

  const { error, stderr } = await cli(
    [
      'test/fixtures/a.css',
      'test/fixtures/b.css',
      '--dir', dir,
      '--no-map'
    ]
  )

  t.ifError(error, stderr)

  t.is(
    await read(path.join(dir, 'a.css')),
    await read('test/fixtures/a.css')
  )

  t.is(
    await read(path.join(dir, 'b.css')),
    await read('test/fixtures/b.css')
  )
})
