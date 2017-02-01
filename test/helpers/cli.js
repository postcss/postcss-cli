'use strict'

const path = require('path')
const exec = require('child_process').execFile

module.exports = function (args, cwd) {
  return new Promise((resolve) => {
    exec(
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
