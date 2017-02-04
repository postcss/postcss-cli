import test from 'ava'

import fs from 'fs-promise'
import path from 'path'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('--replace works', async function (t) {
  const dir = tmp()

  const output = path.join(dir, 'output.css')

  await Promise.all([
    fs.copy('test/fixtures/import.css', output),
    fs.copy('test/fixtures/a.css', path.join(dir, 'a.css'))
  ])

  const { error, stderr } = await cli(
    [
      output,
      '--replace',
      '-u', 'postcss-import',
      '--no-map'
    ]
  )

  t.ifError(error, stderr)

  t.is(
    await read(output),
    await read('test/fixtures/a.css')
  )
})
