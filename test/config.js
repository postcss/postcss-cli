import test from 'ava'
import path from 'path'
import createEnv from './helpers/create-config-env.js'
import run from './helpers/run-cli.js'
import read from './helpers/readFile.js'

test('supports common config', async function (t) {
  var env = `module.exports = {
    plugins: [
      require('postcss-import')()
    ]
  }`
  var dir = await createEnv(env, ['*a-red.css'])
  var { error, stderr } = await run(['imports-a-red.css', '-o', 'out.css'], dir)
  t.ifError(error, stderr)
  t.is(await read(path.join(dir, 'out.css')), await read('test/fixtures/a-red.css'))
})

test("doesn't error on empty config", async function (t) {
  var env = `module.exports = {}`
  var dir = await createEnv(env, ['a-red.css'])
  var { error, stderr } = await run(['a-red.css', '-o', 'out.css'], dir)
  t.ifError(error, stderr)
  t.is(await read(path.join(dir, 'out.css')), await read('test/fixtures/a-red.css'))
})
