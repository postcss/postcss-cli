'use strict'
const test = require('ava')
const path = require('path')

const cli = require('./helpers/cli.js')
const tmp = require('./helpers/tmp.js')
const read = require('./helpers/read.js')

test('--dir works', async (t) => {
  const dir = tmp()

  const { error, stderr } = await cli([
    'test/fixtures/a.css',
    'test/fixtures/b.css',
    '--dir',
    dir,
    '--no-map',
  ])

  t.falsy(error, stderr)

  t.is(await read(path.join(dir, 'a.css')), await read('test/fixtures/a.css'))

  t.is(await read(path.join(dir, 'b.css')), await read('test/fixtures/b.css'))
})
