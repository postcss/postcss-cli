import test from 'ava'

import tmp from './helpers/tmp.js'
import cli from './helpers/cli.js'

test('multiple input files && --output', (t) => {
  return cli(['test/fixtures/*.css', '-o', tmp()]).then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error.toString(), /Input Error: Must use --dir or --replace/)
  })
})

test('multiple input files && writing to stdout', (t) => {
  return cli(['test/fixtures/*.css']).then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error.toString(), /Input Error: Must use --dir or --replace/)
  })
})

test('--map && writing to stdout', (t) => {
  return cli(['test/fixtures/a.css', '--map']).then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(
      error.toString(),
      /Output Error: Cannot output external sourcemaps when writing to STDOUT/,
    )
  })
})

test('plugin not found', (t) => {
  return cli(['test/fixtures/a.css', '-u', 'postcss-plugin', '-o', tmp()]).then(
    ({ error, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(
        error.toString(),
        /Plugin Error: Cannot find package 'postcss-plugin'/,
      )
    },
  )
})

test('plugin throws on require', (t) => {
  return cli([
    'test/fixtures/a.css',
    '-u',
    './test/fixtures/_bad-plugin.js',
    '-o',
    tmp(),
  ]).then(({ error, code }) => {
    t.is(code, 1, 'expected non-zero error code')
    t.regex(error.toString(), /Plugin Error \(.*bad-plugin.js\): This fails/)
  })
})

test('CssSyntaxError', (t) => {
  return cli(['test/fixtures/a.css', '--parser', 'sugarss', '-o', tmp()]).then(
    ({ error, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(
        error.toString(),
        /CssSyntaxError: .*a.css:1:4: Unnecessary curly bracket/,
      )
    },
  )
})

test('fails on invalid explicit config', async (t) => {
  const output = tmp('output-ignore.css')

  const { stderr, code } = await cli([
    'test/fixtures/a.css',
    '-o',
    output,
    '--config',
    '/foo/bar',
  ])
  t.is(code, 1, 'expected non-zero error code')
  t.regex(stderr, /No PostCSS Config found/)
})
