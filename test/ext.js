import test from 'ava'
import fs from 'fs'

import cli from './helpers/cli.js'

test('--ext works', async function (t) {
  const dir = 'test/fixtures/.tmp'

  const { error, stderr } = await cli(
    [
      'test/fixtures/a.sss',
      '-u', 'postcss-import',
      '-d', dir,
      '-ex', '.css'
    ]
  )
  t.ifError(error, stderr)

  t.truthy(fs.existsSync(`${dir}/a.css`))
})
