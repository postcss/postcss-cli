'use strict'
const test = require('ava')

const cli = require('./helpers/cli.js')

test('--help', async (t) => {
  const help = await cli(['--help'])

  t.falsy(help.error)

  t.truthy(help.stdout.length > 10, 'expected --help to output a help message')
})

test('--version', async (t) => {
  const version = await cli(['--version'])

  t.falsy(version.error)

  t.truthy(
    version.stdout.length > 5,
    'expected --version to output version info'
  )
})
