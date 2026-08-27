import test from 'ava'

import { createReadStream } from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

import tmp from './helpers/tmp.js'
import read from './helpers/read.js'

test.cb('reads from stdin', (t) => {
  const output = tmp('output.css')

  const cp = exec(
    `node ${path.resolve('index.js')} -o ${output} --no-map`,
    (error, stdout, stderr) => {
      if (error) t.end(error, stderr)

      Promise.all([read(output), read('test/fixtures/a.css')])
        .then(([a, e]) => {
          t.is(a, e)
          t.end()
        })
        .catch(t.end)
    },
  )

  createReadStream('test/fixtures/a.css').pipe(cp.stdin)
})
