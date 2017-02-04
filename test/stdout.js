import test from 'ava'

import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'

import read from './helpers/read.js'

test.cb('writes to stdout', function (t) {
  const cp = execFile(
    path.resolve('bin/postcss'),
    [
      '-p', 'sugarss',
      '-u', 'postcss-import',
      '--no-map'
    ],
    (error, stdout, stderr) => {
      if (error) t.end(error, stderr)

      Promise.all([ stdout, read('test/fixtures/s.css') ])
        .then(([ a, e ]) => {
          t.is(a, e)
          t.end()
        })
        .catch(t.end)
    }
  )

  fs.createReadStream('./test/fixtures/a.sss').pipe(cp.stdin)
})
