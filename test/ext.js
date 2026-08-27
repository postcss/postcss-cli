import test from 'ava'

import fs from 'node:fs/promises'
import path from 'node:path'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'

test('--ext works', async (t) => {
  const dir = tmp()

  const { error, stderr } = await cli([
    'test/fixtures/a.sss',
    '--parser',
    'sugarss',
    '-d',
    dir,
    '--ext',
    '.css',
  ])
  t.falsy(error, stderr)

  t.truthy(
    await fs.access(path.join(dir, 'a.css')).then(
      () => true,
      () => false,
    ),
  )
})

test('--ext works with no leading dot', async (t) => {
  const dir = tmp()

  const { error, stderr } = await cli([
    'test/fixtures/a.sss',
    '--parser',
    'sugarss',
    '-d',
    dir,
    '--ext',
    'css',
  ])
  t.falsy(error, stderr)

  t.truthy(
    await fs.access(path.join(dir, 'a.css')).then(
      () => true,
      () => false,
    ),
  )
})
