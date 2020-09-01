'use strict'
const test = require('ava')
const path = require('path')

const ENV = require('./helpers/env.js')

const cli = require('./helpers/cli.js')
const read = require('./helpers/read.js')

test('supports common config', async (t) => {
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

  t.falsy(error, stderr)

  t.is(
    await read(path.join(dir, 'output.css')),
    await read('test/fixtures/a.css')
  )
})

test("doesn't error on empty config", async (t) => {
  const env = `module.exports = {}`

  const dir = await ENV(env, ['a.css'])

  const { error, stderr } = await cli(
    ['a.css', '-o', 'output.css', '--no-map'],
    dir
  )

  t.falsy(error, stderr)

  t.is(
    await read(path.join(dir, 'output.css')),
    await read('test/fixtures/a.css')
  )
})

test('errors if `to` is set', async (t) => {
  const env = `module.exports = {
    to: 'out.css'
  }`

  const dir = await ENV(env, ['a.css'])

  const { stderr } = await cli(['a.css', '-o', 'output.css', '--no-map'], dir)

  t.regex(
    stderr,
    /Config Error: Can not set from or to options in config file, use CLI arguments instead/
  )
})

test('errors if `from` is set', async (t) => {
  const env = `module.exports = {
    from: 'in.css'
  }`

  const dir = await ENV(env, ['a.css'])

  const { stderr } = await cli(['a.css', '-o', 'output.css', '--no-map'], dir)

  t.regex(
    stderr,
    /Config Error: Can not set from or to options in config file, use CLI arguments instead/
  )
})
