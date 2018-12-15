import test from 'ava'
import path from 'path'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('--base --dir works', async t => {
  const dir = tmp()

  const { error, stderr } = await cli([
    '"test/fixtures/base/**/*.css"',
    '--dir',
    dir,
    '--base',
    'test/fixtures/base',
    '--no-map'
  ])

  t.falsy(error, stderr)

  t.is(
    await read(path.join(dir, 'level-1/level-2/a.css')),
    await read('test/fixtures/base/level-1/level-2/a.css')
  )

  t.is(
    await read(path.join(dir, 'level-1/b.css')),
    await read('test/fixtures/base/level-1/b.css')
  )
})
