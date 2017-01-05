import test from 'ava'
import run from './helpers/run-cli.js'
import fs from 'fs-promise'
import path from 'path'
import tmp from 'tempfile'

function read (path) {
  return fs.readFile(path, 'utf8')
}

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
