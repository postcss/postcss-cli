import test from 'ava'

import fs from 'fs-extra'
import path from 'path'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'

test('--ext works', async t => {
  const dir = tmp()

  const { error, stderr } = await cli([
    'test/fixtures/a.sss',
    '-p',
    'sugarss',
    '-d',
    dir,
    '--ext',
    '.css'
  ])
  t.falsy(error, stderr)

  t.truthy(await fs.pathExists(path.join(dir, 'a.css')))
})
