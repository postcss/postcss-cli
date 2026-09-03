import test from 'ava'
import path from 'node:path'

import ENV from './helpers/env.js'

import cli from './helpers/cli.js'
import read from './helpers/read.js'
import tmp from './helpers/tmp.js'

test('supports common config', async (t) => {
  const env = `module.exports = {
    plugins: [
      require('postcss-import')()
    ]
  }`

  const dir = await ENV(env, ['import.css', 'a.css'])

  const { error, stderr } = await cli(
    ['import.css', '-o', 'output.css', '--no-map'],
    dir,
  )

  t.falsy(error, stderr)

  t.is(
    await read(path.join(dir, 'output.css')),
    await read('test/fixtures/a.css'),
  )
})

test('supports ESM config', async (t) => {
  const env = `import postcssImport from 'postcss-import'
  export default function () {
    return {
      plugins: [
        postcssImport()
      ]
    }
  }`

  const dir = await ENV(env, ['import.css', 'a.css'], 'mjs')

  const { error, stderr } = await cli(
    ['import.css', '-o', 'output.css', '--no-map'],
    dir,
  )

  t.falsy(error, stderr)

  t.is(
    await read(path.join(dir, 'output.css')),
    await read('test/fixtures/a.css'),
  )
})

test("doesn't error on empty config", async (t) => {
  const env = `module.exports = {}`

  const dir = await ENV(env, ['a.css'])

  const { error, stderr } = await cli(
    ['a.css', '-o', 'output.css', '--no-map'],
    dir,
  )

  t.falsy(error, stderr)

  t.is(
    await read(path.join(dir, 'output.css')),
    await read('test/fixtures/a.css'),
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
    /Config Error: Can not set from or to options in config file, use CLI arguments instead/,
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
    /Config Error: Can not set from or to options in config file, use CLI arguments instead/,
  )
})

test('supports --config flag', async (t) => {
  const output = tmp('output.css')

  const { error, stderr } = await cli([
    'test/fixtures/import.css',
    '-o',
    output,
    '--no-map',
    '--config',
    'test/fixtures/cfg-dir',
  ])

  t.falsy(error, stderr)

  t.is(await read(output), await read('test/fixtures/a.css'))
})
