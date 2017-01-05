'use strict'
const execFile = require('child_process').execFile

module.exports = function (args) {
  return new Promise(function (resolve) {
    execFile('bin/postcss', args, function (error, stdout, stderr) {
      resolve({
        code: error && error.code ? error.code : 0,
        error,
        stdout,
        stderr
      })
    })
  })
}
