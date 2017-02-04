import test from 'ava'

import cli from './helpers/cli.js'

test('--help', async function (t) {
  const help = await cli(['--help'])

  t.ifError(help.error)

  t.truthy(
    help.stdout.length > 10,
    'expected --help to output a help message'
  )
})
test('--version', async function (t) {
  const version = await cli(['--version'])

  t.ifError(version.error)

  t.truthy(
    version.stdout.length > 10,
    'expected --version to output version info'
  )
})
