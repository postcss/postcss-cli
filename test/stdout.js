import test from 'ava'

import { createReadStream } from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

import read from './helpers/read.js'

test('writes to stdout', (t) => {
  return new Promise((resolve, reject) => {
    const cp = exec(
      `node ${path.resolve(
        'index.js',
      )} --parser sugarss -u postcss-import --no-map`,
      (error, stdout) => {
        if (error) return reject(error)

        Promise.all([
          stdout.replace(/\r\n/g, '\n'),
          read('test/fixtures/s.css'),
        ])
          .then(([a, e]) => {
            t.is(a, e)
            resolve()
          })
          .catch(reject)
      },
    )

    createReadStream('./test/fixtures/a.sss').pipe(cp.stdin)
  })
})
