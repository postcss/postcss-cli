import test from 'ava'

import { createReadStream } from 'node:fs'
import path from 'path'
import { exec } from 'child_process'

import read from './helpers/read.js'

test.cb('writes to stdout', (t) => {
  const cp = exec(
    `node ${path.resolve(
      'index.js',
    )} --parser sugarss -u postcss-import --no-map`,
    (error, stdout, stderr) => {
      if (error) t.end(error, stderr)

      Promise.all([stdout.replace(/\r\n/g, '\n'), read('test/fixtures/s.css')])
        .then(([a, e]) => {
          t.is(a, e)
          t.end()
        })
        .catch(t.end)
    },
  )

  createReadStream('./test/fixtures/a.sss').pipe(cp.stdin)
})
