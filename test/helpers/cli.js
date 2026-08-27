import path from 'node:path'
import { exec } from 'node:child_process'

export default function (args, cwd) {
  return new Promise((resolve) => {
    exec(
      `node ${path.resolve('index.js')} ${args.join(' ')}`,
      { cwd },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr,
        })
      },
    )
  })
}
