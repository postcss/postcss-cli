import test from 'ava'

import tmp from './helpers/tmp.js'
import cli from './helpers/cli.js'

// ensure that configuration errors are thrown in watch mode as well as normal mode
;[false, true].forEach((watch) => {
  const prefix = watch ? 'watch mode: ' : ''
  const additionalArgs = watch ? ['--watch'] : []

  test(`${prefix}multiple input files && --output`, (t) => {
    return cli(['test/fixtures/*.css', '-o', tmp(), ...additionalArgs]).then(
      ({ error, code }) => {
        t.is(code, 1, 'expected non-zero error code')
        t.regex(error.toString(), /Input Error: Must use --dir or --replace/)
      },
    )
  })

  test(`${prefix}plugin not found`, (t) => {
    return cli([
      'test/fixtures/a.css',
      '-u',
      'postcss-plugin',
      '-o',
      tmp(),
      ...additionalArgs,
    ]).then(({ error, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(
        error.toString(),
        /Plugin Error: Cannot find package 'postcss-plugin'/,
      )
    })
  })

  test(`${prefix}plugin throws on require`, (t) => {
    return cli([
      'test/fixtures/a.css',
      '-u',
      './test/fixtures/_bad-plugin.js',
      '-o',
      tmp(),
      ...additionalArgs,
    ]).then(({ error, code }) => {
      t.is(code, 1, 'expected non-zero error code')
      t.regex(error.toString(), /Plugin Error \(.*bad-plugin.js\): This fails/)
    })
  })

  test(`${prefix}fails on invalid explicit config`, async (t) => {
    const output = tmp('output-ignore.css')

    const { stderr, code } = await cli([
      'test/fixtures/a.css',
      '-o',
      output,
      '--config',
      '/foo/bar',
      ...additionalArgs,
    ])
    t.is(code, 1, 'expected non-zero error code')
    t.regex(stderr, /No PostCSS Config found/)
  })
})

// These errors cannot occur in watch mode; watch mode does not support stdout
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

// Watch mode does not exit on CssSyntaxError, this is tested in ./watch.js
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
