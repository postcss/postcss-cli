'use strict'
const test = require('ava')

const fs = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')

const tmp = require('./helpers/tmp.js')
const read = require('./helpers/read.js')

test.cb('reads from stdin', (t) => {
  const output = tmp('output.css')

  const cp = exec(
    `node ${path.resolve('bin/postcss')} -o ${output} --no-map`,
    (error, stdout, stderr) => {
      if (error) t.end(error, stderr)

      Promise.all([read(output), read('test/fixtures/a.css')])
        .then(([a, e]) => {
          t.is(a, e)
          t.end()
        })
        .catch(t.end)
    }
  )

  fs.createReadStream('test/fixtures/a.css').pipe(cp.stdin)
})
