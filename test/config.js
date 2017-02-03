import test from 'ava'
import path from 'path'

import ENV from './helpers/env.js'

import cli from './helpers/cli.js'
import read from './helpers/read.js'

test('supports common config', async function (t) {
  const env = `module.exports = {
    plugins: [
      require('postcss-import')()
    ]
  }`

  const dir = await ENV(env, ['a.css'])

  const { error, stderr } = await cli(
    ['a.css', '-o', 'output.css', '--no-map'],
    dir
  )

  t.ifError(error, stderr)

  t.is(
    await read(path.join(dir, 'output.css')),
    await read('test/fixtures/a.css')
  )
})

test("doesn't error on empty config", async function (t) {
  const env = `module.exports = {}`

  const dir = await ENV(env, ['a.css'])

  const { error, stderr } = await cli(
    ['a.css', '-o', 'output.css', '--no-map'],
    dir
  )

  t.ifError(error, stderr)

  t.is(
    await read(path.join(dir, 'output.css')),
    await read('test/fixtures/a.css')
  )
})
