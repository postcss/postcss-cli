import test from 'ava'
import run from './helpers/run-cli.js'
import fs from 'fs-promise'
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
