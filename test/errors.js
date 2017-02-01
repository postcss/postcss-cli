import test from 'ava'

import tmp from './helpers/tmp.js'
import cli from './helpers/cli.js'

test('multiple input files && --output is set', (t) => {
  return cli(
    [ 'test/fixtures/*.css', '-o', tmp() ]
  )
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /Must use --dir or --replace/)
  })
})

test('invalid --config option', (t) => {
  return cli(
    [ 'test/fixtures/*.css', '-c', 'test/postcss.config.js', '-o', tmp() ]
  )
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /ENOENT: no such file or directory/)
  })
})

test('when CssSyntaxError', (t) => {
  return cli(
    [ 'test/fixtures/a.css', '-p', 'sugarss', '-o', tmp() ]
  )
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /\[1:3] Unnecessary curly bracket/)
  })
})
