'use strict'

import path from 'path'
import { execFile } from 'child_process'

export default function (args, cwd) {
  return new Promise((resolve) => {
    execFile(
      path.resolve('bin/postcss'),
      args, { cwd },
      (err, stdout, stderr) => {
        resolve({
          code: err && err.code ? err.code : 0,
          err,
          stdout,
          stderr
        })
      })
  })
}
