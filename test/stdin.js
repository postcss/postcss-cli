import test from 'ava'

import { createReadStream } from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test('reads from stdin', (t) => {
  const output = tmp('output.css')

  return new Promise((resolve, reject) => {
    const cp = exec(
      `node ${path.resolve('index.js')} -o ${output} --no-map`,
      (error) => {
        if (error) return reject(error)

        Promise.all([read(output), read('test/fixtures/a.css')])
          .then(([a, e]) => {
            t.is(a, e)
            resolve()
          })
          .catch(reject)
      },
    )

    createReadStream('test/fixtures/a.css').pipe(cp.stdin)
  })
})
