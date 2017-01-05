import test from 'ava'
import run from './helpers/run-cli.js'

test('--help', async function (t) {
  var res = await run(['--help'])
  t.ifError(res.error)
  t.truthy(res.stdout.length > 10, 'expected --help to output a help message')
})
test('--version', async function (t) {
  var res = await run(['--version'])
  t.ifError(res.error)
  t.truthy(res.stdout.length > 10, 'expected --version to output version info')
})
