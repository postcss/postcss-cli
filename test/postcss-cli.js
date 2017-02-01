import test from 'ava'

import fs from 'fs-promise'
import path from 'path'
import { execFile } from 'child_process'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('works without plugins/config', async function (t) {
  const output = tmp('a.css')

  const { error, stderr } = await cli(
    ['test/fixtures/a.css', '-o', output]
  )

  t.ifError(error, stderr)

  t.is(
    await read(output),
    await read('test/fixtures/a.css')
  )
})

test.cb('reads from stdin if no files are passed', (t) => {
  const output = tmp('a.css')

  const cp = execFile(
    path.resolve('bin/postcss'),
    ['-o', output],
    (error, stdout, stderr) => {
      if (error) t.end(error, stderr)

      Promise.all([ read(output), read('test/fixtures/a.css') ])
        .then(([ a, e ]) => {
          t.is(a, e)
          t.end()
        })
        .catch(t.end)
    }
  )

  fs.createReadStream('test/fixtures/a.css').pipe(cp.stdin)
})

test('--dir works', async function (t) {
  const dir = tmp()

  const { error, stderr } = await cli(
    [ 'test/fixtures/a.css', 'test/fixtures/b.css', '-d', dir ]
  )

  t.ifError(error, stderr)

  t.is(
    await read(path.join(dir, 'a.css')),
    await read('test/fixtures/a.css'))

  t.is(
    await read(path.join(dir, 'b.css')),
    await read('test/fixtures/b.css')
  )
})

test('--replace works', async function (t) {
  const dir = tmp()

  const output = path.join(dir, 'output.css')

  await Promise.all([
    fs.copy('test/fixtures/import.css', output),
    fs.copy('test/fixtures/a.css', path.join(dir, 'a.css'))
  ])

  const { error, stderr } = await cli(
    [ output, '--replace', '-u', 'postcss-import', '--no-map' ]
  )

  t.ifError(error, stderr)

  t.is(
    await read(output),
    await read('test/fixtures/a.css')
  )
})

test('--use works', async function (t) {
  const output = tmp('import.css')

  const { error, stderr } = await cli(
    [
      'test/fixtures/import.css',
      '-u', 'postcss-import',
      '-o', output,
      '--no-map'
    ]
  )

  t.ifError(error, stderr)

  t.is(await read(output), await read('test/fixtures/a.css'))
})

test('--parser works', async function (t) {
  const output = tmp('a.css')

  const { error, stderr } = await cli(
    [ 'test/fixtures/a.sss', '-p', 'sugarss', '-o', output, '--no-map' ]
  )

  t.ifError(error, stderr)

  t.is(
    await read(output),
    await read('test/fixtures/a.css')
  )
})

test('--stringifier works', async function (t) {
  const output = tmp('a.sss')

  const { error, stderr } = await cli(
    [ 'test/fixtures/s.css', '-t', 'sugarss', '-o', output, '--no-map' ]
  )

  t.ifError(error, stderr)

  t.is(
    await read(output),
    await read('test/fixtures/a.sss')
  )
})

test('--syntax works', async function (t) {
  const output = tmp('a.css')

  const { error, stderr } = await cli(
    [ 'test/fixtures/a.sss', '-s', 'sugarss', '-o', output, '--no-map' ]
  )

  t.ifError(error, stderr)

  t.is(
    await read(output),
    await read('test/fixtures/a.css')
  )
})
