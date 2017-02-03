import test from 'ava'

import tmp from './helpers/tmp.js'
import cli from './helpers/cli.js'

test.skip('multiple input files && --output', (t) => {
  return cli(
    [
      'test/fixtures/*.css',
      '-o', tmp('.')
    ]
  )
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /Must use --dir or --replace/)
  })
})

test.skip('invalid --config', (t) => {
  return cli(
    [
      'test/fixtures/*.css',
      '-c', 'test/postcss.config.js',
      '-o', tmp()
    ]
  )
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /ENOENT: no such file or directory/)
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
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /\[1:3] Unnecessary curly bracket/)
  })
})
