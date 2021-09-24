import test from 'ava'

import fs from 'fs-extra'
import path from 'path'
import { exec } from 'child_process'

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
    }
  )

  fs.createReadStream('test/fixtures/a.css').pipe(cp.stdin)
})
