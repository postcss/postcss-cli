'use strict'
const test = require('ava')
const path = require('path')

const cli = require('./helpers/cli.js')
const tmp = require('./helpers/tmp.js')
const read = require('./helpers/read.js')

test('--base --dir works', async (t) => {
  const dir = tmp()

  const { error, stderr } = await cli([
    '"test/fixtures/base/**/*.css"',
    '--dir',
    dir,
    '--base',
    'test/fixtures/base',
    '--no-map',
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
