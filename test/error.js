import test from 'ava'

import tmp from './helpers/tmp.js'
import cli from './helpers/cli.js'

test('multiple input files && --output', t => {
  return cli(['test/fixtures/*.css', '-o', tmp()]).then(({ err, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(err.toString(), /Input Error: Must use --dir or --replace/)
  })
})

test('multiple input files && writing to stdout', t => {
  return cli(['test/fixtures/*.css']).then(({ err, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(err.toString(), /Input Error: Must use --dir or --replace/)
  })
})

test('--map && writing to stdout', t => {
  return cli(['test/fixtures/a.css', '--map']).then(({ err, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(
      err.toString(),
      /Output Error: Cannot output external sourcemaps when writing to STDOUT/
    )
  })
})

test.failing('invalid --config', t => {
  return cli([
    'test/fixtures/*.css',
    '-c',
    'test/postcss.config.js',
    '-d',
    tmp()
  ]).then(({ err, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(err.toString(), /ENOENT: no such file or directory/)
  })
})

test('PluginError', t => {
  return cli(['test/fixtures/a.css', '-u', 'postcss-plugin', '-o', tmp()]).then(
    ({ err, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(
        err.toString(),
        /Plugin Error: Cannot find module 'postcss-plugin'/
      )
    }
  )
})

test('CssSyntaxError', t => {
  return cli(['test/fixtures/a.css', '--parser', 'sugarss', '-o', tmp()]).then(
    ({ err, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(
        err.toString(),
        /CssSyntaxError: .*a.css:1:4: Unnecessary curly bracket/
      )
    }
  )
})
