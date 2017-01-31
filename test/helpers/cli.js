'use strict'

const path = require('path')
const { execFile } = require('child_process')

module.exports = function (args, cwd) {
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
