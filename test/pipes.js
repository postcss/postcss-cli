import test from 'ava'

import fs from 'fs'
import path from 'path'
import { execFile } from 'child_process'

// import cli from './helpers/cli.js'
import read from './helpers/read.js'

test('pipe stdin to stdout', async function (t) {
  const cp = execFile(
    path.resolve('bin/postcss'),
    ['-p', 'sugarss', '-u', 'postcss-import'],
    (error, stdout, stderr) => {
      if (error) t.end(error, stderr)

      console.log(stdout)

      Promise.all([ read('test/fixtures/a.css'), stdout ])
        .then(([ a, e ]) => {
          t.is(a, e)
          t.end()
        })
        .catch(t.end)
    }
  )

  fs.createReadStream('./test/fixtures/a.sss').pipe(cp.stdin)
})
