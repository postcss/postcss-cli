import test from 'ava'

import run from './helpers/run-cli.js'

test('errors when no --output, --dir, or --replace option is passed', (t) => {
  return run([ 'test/fixtures/a-red.css' ])
    .then(({ error, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(error, /No Output specified, either --output, --dir, or --replace option must be passed/)
    })
})
