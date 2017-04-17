import test from 'ava'
import path from 'path'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('--context --dir works', async function (t) {
  const dir = tmp()

  const { error, stderr } = await cli(
    [
      'test/fixtures/context/**/*.css',
      '--dir', dir,
      '--context', 'test/fixtures/context',
      '--no-map'
    ]
  )

  t.ifError(error, stderr)

  t.is(
    await read(path.join(dir, 'level-1/level-2/a.css')),
    await read('test/fixtures/context/level-1/level-2/a.css')
  )

  t.is(
    await read(path.join(dir, 'level-1/b.css')),
    await read('test/fixtures/context/level-1/b.css')
  )
})
