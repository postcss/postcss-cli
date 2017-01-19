import test from 'ava'
import run from './helpers/run-cli.js'
import read from './helpers/readFile.js'
import fs from 'fs-promise'
import tmp from './helpers/get-tmp.js'

test('--map generates external sourcemaps', async function (t) {
  var out = tmp('.css')
  var { error, stderr } = await run([
    'test/fixtures/imports-a-red.css',
    '-u', 'postcss-import',
    '-o', out,
    '--map'
  ])
  t.ifError(error, stderr)
  t.truthy(await fs.exists(out.replace('.css', '.css.map')))
})

test('--no-map disables internal sourcemaps', async function (t) {
  var out = tmp('.css')
  var { error, stderr } = await run([
    'test/fixtures/imports-a-red.css',
    '-u', 'postcss-import',
    '-o', out,
    '--no-map'
  ])
  t.ifError(error, stderr)
  t.notRegex(await read(out), /\/*# sourceMappingURL=/)
})
