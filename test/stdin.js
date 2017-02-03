import test from 'ava'

import fs from 'fs-promise'
import path from 'path'
import { execFile } from 'child_process'

import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test.cb('reads from stdin', (t) => {
  const output = tmp('output.css')

  let cp = execFile(
    path.resolve('bin/postcss'),
    ['-o', output, '--no-map'],
    (error, stdout, stderr) => {
      if (error) t.end(error, stderr)

      Promise.all([ read(output), read('test/fixtures/a.css') ])
        .then(([ a, e ]) => {
          t.is(a, e)
          t.end()
        })
        .catch(t.end)
    }
  )

  fs.createReadStream('test/fixtures/a.css').pipe(cp.stdin)
})
