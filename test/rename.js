import test from 'ava'

import fs from 'fs-extra'
import path from 'path'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('--rename works', async t => {
  const dir = tmp()

  const output = path.join(dir, 'output.css')

  await Promise.all([fs.copy('test/fixtures/a.css', path.join(dir, 'a.css'))])

  // XXX: Should be able to pass output instead of dir here, but this test env is weird
  const { error, stderr } = await cli([
    dir,
    '--rename',
    'output.js',
    '-u',
    'postcss-import',
    '--no-map'
  ])

  t.ifError(error, stderr)

  t.is(await read(output), await read('test/fixtures/a.css'))
})

test('--rename works with --dir', async t => {
  const dir = tmp()

  const output = path.join(dir, 'foo', 'output.css')

  await fs.copy('test/fixtures/a.css', path.join(dir, 'a.css'))

  // XXX: Should be able to pass output instead of dir here, but this test env is weird
  const { error, stderr } = await cli([
    dir,
    '--rename',
    'output.js',
    '--dir',
    'foo',
    '-u',
    'postcss-import',
    '--no-map'
  ])

  t.ifError(error, stderr)

  t.is(await read(output), await read('test/fixtures/foo/a.css'))
})
