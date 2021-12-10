import fs from 'fs-extra'
import test from 'ava'

import cli from './helpers/cli.js'

test('files are not saved if the contents are the same', async (t) => {
  const input = 'test/fixtures/unchanged-input.css'
  const output = 'test/fixtures/unchanged-output.css'
  const intialStat = await fs.stat(output)

  const { error, stderr } = await cli([input, '-o', output])

  t.falsy(error, stderr)

  const finalStat = await fs.stat(output)
  t.is(finalStat.mtimeMs, intialStat.mtimeMs)
})
