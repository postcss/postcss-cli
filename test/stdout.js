'use strict'
const test = require('ava')

const fs = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')

const read = require('./helpers/read.js')

test.cb('writes to stdout', (t) => {
  const cp = exec(
    `node ${path.resolve(
      'bin/postcss'
    )} --parser sugarss -u postcss-import --no-map`,
    (error, stdout, stderr) => {
      if (error) t.end(error, stderr)

      Promise.all([stdout.replace(/\r\n/g, '\n'), read('test/fixtures/s.css')])
        .then(([a, e]) => {
          t.is(a, e)
          t.end()
        })
        .catch(t.end)
    }
  )

  fs.createReadStream('./test/fixtures/a.sss').pipe(cp.stdin)
})
