import test from 'ava'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('works with defaults', async function (t) {
  const output = tmp('output.css')

  const { error, stderr } = await cli(
    [
      'test/fixtures/a.css',
      '-o', output,
      '--no-map'
    ]
  )

  t.ifError(error, stderr)

  t.is(
    await read(output),
    await read('test/fixtures/a.css')
  )
})
