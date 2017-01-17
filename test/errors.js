import test from 'ava'

import run from './helpers/run-cli.js'

test('Errors - Output', (t) => {
  return run([ 'test/fixtures/a-red.css' ])
    .then(({ error, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(error, /No Output specified, either --output, --dir, or --replace option must be passed/)
    })
})

test('Errors - Config', (t) => {
  return run([
    'test/fixtures/*.css',
    '--config', 'test/fixtures/postcss.config.js',
    '-o', 'test/fixtures/.tmp/out.css'
  ])
    .then(({ error, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(error, /ENOENT: no such file or directory/)
    })
})

test('Errors - CssSyntaxError', (t) => {
  return run([
    'test/fixtures/*.css',
    '-p', 'sugarss',
    '-o', 'test/fixtures/.tmp/out.css'
  ])
    .then(({ error, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(error, /\[1:3] Unnecessary curly bracket/)
    })
})
