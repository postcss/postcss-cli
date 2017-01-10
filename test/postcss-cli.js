import test from 'ava'
import run from './helpers/run-cli.js'
import read from './helpers/readFile.js'
import path from 'path'
import tmp from './helpers/get-tmp.js'

test('works without plugins or config', async function (t) {
  var out = tmp('.css')
  var { error } = await run(['test/fixtures/a-red.css', '-o', out])
  t.ifError(error)
  t.is(await read(out), await read('test/fixtures/a-red.css'))
})

test('--dir works', async function (t) {
  var outDir = tmp()
  var { error } = await run(['test/fixtures/a-red.css', 'test/fixtures/a-blue.css', '--dir', outDir])
  t.ifError(error)
  t.is(await read(path.join(outDir, 'a-red.css')), await read('test/fixtures/a-red.css'))
  t.is(await read(path.join(outDir, 'a-blue.css')), await read('test/fixtures/a-blue.css'))
})

test('--parser works', async function (t) {
  var out = tmp('.css')
  var { error } = await run(['test/fixtures/sugar-white.sss', '--parser', 'sugarss', '-o', out])
  t.ifError(error)
  t.is(await read(out), await read('test/fixtures/sugar-white.css'))
})

test('--stringifier works', async function (t) {
  var out = tmp('.css')
  var { error } = await run(['test/fixtures/sugar-white.css', '--stringifier', 'sugarss', '-o', out])
  t.ifError(error)
  t.is(await read(out), await read('test/fixtures/sugar-white.sss'))
})

test('--syntax works', async function (t) {
  var out = tmp('.css')
  var { error } = await run(['test/fixtures/sugar-white.sss', '--syntax', 'sugarss', '-o', out])
  t.ifError(error)
  t.is(await read(out), await read('test/fixtures/sugar-white.sss'))
})
