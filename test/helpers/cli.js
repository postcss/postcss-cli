'use strict'
const path = require('path')
const { exec } = require('child_process')

module.exports = function (args, cwd) {
  return new Promise((resolve) => {
    exec(
      `node ${path.resolve('bin/postcss')} ${args.join(' ')}`,
      { cwd },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr,
        })
      }
    )
  })
}
