'use strict'
const path = require('path')
const execFile = require('child_process').execFile

module.exports = function (args, cwd) {
  return new Promise(function (resolve) {
    execFile(path.resolve('bin/postcss'), args, {cwd}, function (error, stdout, stderr) {
      resolve({
        code: error && error.code ? error.code : 0,
        error,
        stdout,
        stderr
      })
    })
  })
}
