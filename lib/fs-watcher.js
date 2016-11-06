var async = require('neo-async')
var compile = require('./compile')
var onError = require('./on-error')

function fsWatcher (argv, entryPoints) {
  var watchedFiles = entryPoints
  var index = {} // source files by entry point
  var opts = {}

  if (argv.poll) {
    opts.usePolling = true
  }
  if (typeof argv.poll === 'number') {
    opts.interval = argv.poll
  }

  var watcher = require('chokidar').watch(watchedFiles, opts)
  // recompile if any watched file is modified
  // TODO: only recompile relevant entry point
  watcher.on('change', function () {
    async.forEach(entryPoints, compile, function (err) {
      return onError.call(this, err, true)
    })
  })

  return function updateWatchedFiles (files, entryPoint) {
    // update source files for current entry point
    entryPoint = entryPoint || null
    index[entryPoint] = files
    // aggregate source files across entry points
    var entryPoints = Object.keys(index)
    var sources = entryPoints.reduce(function (files, entryPoint) {
      return files.concat(index[entryPoint])
    }, [])
    // update watch list
    watcher.unwatch(watchedFiles)
    watcher.add(sources)
    watchedFiles = sources
  }
}

module.exports = fsWatcher
