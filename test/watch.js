import test from 'ava'
import path from 'path'
import fs from 'fs-promise'
import { execFile } from 'child_process'
import chokidar from 'chokidar'
import createEnv from './helpers/create-config-env.js'
import read from './helpers/readFile.js'

test.cb('--watch mode works', function (t) {
  var cp

  t.plan(2)

  createEnv('', ['a-red.css'])
  .then(dir => {
    // Init watcher:
    var watcher = chokidar.watch('.', {
      cwd: dir,
      ignoreInitial: true,
      awaitWriteFinish: true
    })

    // On the first output:
    watcher.on('add', p => {
      // Assert, then change the source file
      if (p === 'out.css') {
        isEqual(p, 'test/fixtures/a-red.css')
        .then(() => read('test/fixtures/a-blue.css'))
        .then(css => fs.writeFile(path.join(dir, 'a-red.css'), css))
        .catch(done)
      }
    })

    // When the change is picked up:
    watcher.on('change', p => {
      if (p === 'out.css') {
        isEqual(p, 'test/fixtures/a-blue.css')
        .then(() => done())
        .catch(done)
      }
    })

    // Start postcss-cli:
    watcher.on('ready', () => {
      cp = execFile(
        path.resolve('bin/postcss'),
        ['a-red.css', '-o', 'out.css', '-w'],
        {cwd: dir}
      )
      cp.on('error', t.end)
      cp.on('exit', code => { if (code) t.end(code) })
    })

    // Helper functions:
    function isEqual (p, expected) {
      return Promise.all([read(path.join(dir, p)), read(expected)])
      .then(([a, e]) => t.is(a, e))
    }

    function done (err) {
      try {
        cp.kill()
      } catch (e) {}
      t.end(err)
    }
  })
  .catch(t.end)
})
