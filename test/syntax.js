import test from 'ava'

import cli from './helpers/cli.js'
import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('--syntax works', async t => {
  const output = tmp('output.sss')

  const { error, stderr } = await cli([
    'test/fixtures/a.sss',
    '--syntax',
    'sugarss',
    '-o',
    output,
    '--no-map'
  ])

  t.ifError(error, stderr)

  t.is(await read(output), await read('test/fixtures/a.sss'))
})

test('automatically switch syntax', async t => {
  const dir = tmp()

  const { error, stderr } = await cli([
    'test/fixtures/b.*',
    '-d',
    dir,
    '--no-map'
  ])

  t.ifError(error, stderr)

  t.is(await read(`${dir}/b.sss`), await read('test/fixtures/b.sss'))
  t.is(await read(`${dir}/b.css`), await read('test/fixtures/b.css'))
})
