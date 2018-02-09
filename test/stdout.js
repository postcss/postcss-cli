import test from 'ava'

import fs from 'fs-extra'
import path from 'path'
import { exec } from 'child_process'

import read from './helpers/read.js'

test.cb('writes to stdout', t => {
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
