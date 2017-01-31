import test from 'ava'

import tmp from './helpers/tmp.js'
import run from './helpers/cli.js'

test('when no output option', (t) => {
  return run(
    [ 'test/fixtures/a.css' ]
  )
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /No Output specified, either --output, --dir, or --replace option must be passed/)
  })
})

test('when multiple input files and --output is set', (t) => {
  return run(
    [ 'test/fixtures/*.css', '-o', tmp() ]
  )
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /Must use --dir or --replace/)
  })
})

test('when invalid --config option', (t) => {
  return run(
    [ 'test/fixtures/*.css', '-c', 'test/postcss.config.js', '-o', tmp() ]
  )
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /ENOENT: no such file or directory/)
  })
})

test('when CssSyntaxError', (t) => {
  return run(
    [ 'test/fixtures/a.css', '-p', 'sugarss', '-o', tmp() ]
  )
  .then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error, /\[1:3] Unnecessary curly bracket/)
  })
})
