import test from 'ava'

import fs from 'fs'
import path from 'path'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'

test('--ext works', async function (t) {
  const dir = tmp()

  const { error, stderr } = await cli(
    [
      'test/fixtures/a.sss',
      '-p', 'sugarss',
      '-d', dir,
      '--ext', '.css'
    ]
  )
  t.ifError(error, stderr)

  t.truthy(fs.existsSync(path.join(dir, 'a.css')))
})
