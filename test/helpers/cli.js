import path from 'path'
import { exec } from 'child_process'

export default function(args, cwd) {
  return new Promise(resolve => {
    exec(
      `node ${path.resolve('bin/postcss')} ${args.join(' ')}`,
      { cwd },
      (err, stdout, stderr) => {
        resolve({
          code: err && err.code ? err.code : 0,
          err,
          stdout,
          stderr
        })
      }
    )
  })
}
