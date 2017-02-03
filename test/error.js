import test from 'ava'

import tmp from './helpers/tmp.js'
import cli from './helpers/cli.js'

test.skip('multiple input files && --output', (t) => {
  return cli(
    [
      'test/fixtures/*.css',
      '-o', tmp()
    ]
  )
  .then(({ err, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(err, /Must use --dir or --replace/)
  })
})

test.skip('invalid --config', (t) => {
  return cli(
    [
      'test/fixtures/*.css',
      '-c', 'test/postcss.config.js',
      '-d', tmp()
    ]
  )
  .then(({ err, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(err, /ENOENT: no such file or directory/)
  })
})

test.skip('PluginError', (t) => {
  return cli(
    [
      'test/fixtures/a.css',
      '-u', 'postcss-plugin',
      '-o', tmp()
    ]
  )
  .then(({ err, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(err, /PluginError: Cannot find module 'postcss-plugin'/)
  })
})

test.skip('CssSyntaxError', (t) => {
  return cli(
    [
      'test/fixtures/a.css',
      '-p', 'sugarss',
      '-o', tmp()
    ]
  )
  .then(({ err, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(err, /\[1:4] Unnecessary curly bracket/)
  })
})
