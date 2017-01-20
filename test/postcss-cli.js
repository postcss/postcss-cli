import test from 'ava'
import run from './helpers/run-cli.js'
import read from './helpers/readFile.js'
import path from 'path'
import fs from 'fs-promise'
import { execFile } from 'child_process'
import tmp from './helpers/get-tmp.js'

test('works without plugins or config', async function (t) {
  var out = tmp('.css')
  var { error, stderr } = await run(['test/fixtures/a-red.css', '-o', out])
  t.ifError(error, stderr)
  t.is(await read(out), await read('test/fixtures/a-red.css'))
})

test.cb('reads from stdin if no files are passed', t => {
  var out = tmp('.css')
  var cp = execFile(path.resolve('bin/postcss'), ['-o', out], (error, stdout, stderr) => {
    if (error) t.end(error, stderr)
    else {
      Promise.all([read(out), read('test/fixtures/a-red.css')])
        .then(([a, e]) => {
          t.is(a, e)
          t.end()
        })
        .catch(t.end)
    }
  })
  fs.createReadStream('test/fixtures/a-red.css').pipe(cp.stdin)
})

test('--dir works', async function (t) {
  var outDir = tmp()
  var { error, stderr } = await run(['test/fixtures/a-red.css', 'test/fixtures/a-blue.css', '--dir', outDir])
  t.ifError(error, stderr)
  t.is(await read(path.join(outDir, 'a-red.css')), await read('test/fixtures/a-red.css'))
  t.is(await read(path.join(outDir, 'a-blue.css')), await read('test/fixtures/a-blue.css'))
})

test('--replace works', async function (t) {
  var dir = tmp()
  var out = path.join(dir, 'out.css')
  await Promise.all([
    fs.copy('test/fixtures/imports-a-red.css', out),
    fs.copy('test/fixtures/a-red.css', path.join(dir, 'a-red.css'))
  ])
  var { error, stderr } = await run([out, '--replace', '-u', 'postcss-import', '--no-map'])
  t.ifError(error, stderr)
  t.is(await read(out), await read('test/fixtures/a-red.css'))
})

test('--use works', async function (t) {
  var out = tmp('.css')
  var { error, stderr } = await run([
    'test/fixtures/imports-a-red.css',
    '--use', 'postcss-import',
    '-o', out,
    '--no-map'
  ])
  t.ifError(error, stderr)
  t.is(await read(out), await read('test/fixtures/a-red.css'))
})

test('--parser works', async function (t) {
  var out = tmp('.css')
  var { error, stderr } = await run([
    'test/fixtures/sugar-white.sss',
    '--parser', 'sugarss',
    '-o', out,
    '--no-map'
  ])
  t.ifError(error, stderr)
  t.is(await read(out), await read('test/fixtures/sugar-white.css'))
})

test('--stringifier works', async function (t) {
  var out = tmp('.sss')
  var { error, stderr } = await run([
    'test/fixtures/sugar-white.css',
    '--stringifier', 'sugarss',
    '-o', out,
    '--no-map'
  ])
  t.ifError(error, stderr)
  t.is(await read(out), await read('test/fixtures/sugar-white.sss'))
})

test('--syntax works', async function (t) {
  var out = tmp('.css')
  var { error, stderr } = await run([
    'test/fixtures/sugar-white.sss',
    '--syntax', 'sugarss',
    '-o', out,
    '--no-map'
  ])
  t.ifError(error, stderr)
  t.is(await read(out), await read('test/fixtures/sugar-white.sss'))
})
