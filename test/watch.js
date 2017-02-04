import test from 'ava'

import fs from 'fs-promise'
import path from 'path'
import { execFile } from 'child_process'
import chokidar from 'chokidar'

import ENV from './helpers/env.js'
import read from './helpers/read.js'

test.cb('--watch works', function (t) {
  let cp

  t.plan(2)

  ENV('', ['a.css'])
    .then((dir) => {
    // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true
      })

      // On the first output:
      watcher.on('add', (p) => {
        // Assert, then change the source file
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/a.css')
            .then(() => read('test/fixtures/b.css'))
            .then(css => fs.writeFile(path.join(dir, 'a.css'), css))
            .catch(done)
        }
      })

      // When the change is picked up:
      watcher.on('change', (p) => {
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/b.css')
            .then(() => done())
            .catch(done)
        }
      })

      // Start postcss-cli:
      watcher.on('ready', () => {
        cp = execFile(
          path.resolve('bin/postcss'),
          [
            'a.css',
            '-o', 'output.css',
            '-w',
            '--no-map'
          ],
          { cwd: dir }
        )

        cp.on('error', t.end)
        cp.on('exit', code => { if (code) t.end(code) })
      })

      // Helper functions:
      function isEqual (p, expected) {
        return Promise.all([
          read(path.join(dir, p)),
          read(expected)
        ])
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

  // Timeout:
  setTimeout(() => t.end('test timeout'), 50000)
})

test.cb('--watch postcss.config.js', function (t) {
  let cp

  t.plan(2)

  ENV('module.exports = {}', ['import.css', 'a.css'])
    .then((dir) => {
      // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true
      })

      // On the first output:
      watcher.on('add', (p) => {
        // Assert, then change the source file
        if (p === 'output.css') {
          read(path.join(dir, p))
            .then((css) => {
              t.is(css, '@import "./a.css";\n')

              return fs.writeFile(
                path.join(dir, 'postcss.config.js'),
                `module.exports = {
                  plugins: [
                    require('postcss-import')()
                  ]
                }`
              )
            })
            .catch(done)
        }
      })

      // When the change is picked up:
      watcher.on('change', (p) => {
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/a.css')
            .then(() => done())
            .catch(done)
        }
      })

      // Start postcss-cli:
      watcher.on('ready', () => {
        cp = execFile(
          path.resolve('bin/postcss'),
          [
            'import.css',
            '-o', 'output.css',
            '-w',
            '--no-map'
          ],
          { cwd: dir }
        )

        cp.on('error', t.end)
        cp.on('exit', (code) => { if (code) t.end(code) })
      })

      // Helper functions:
      function isEqual (p, expected) {
        return Promise.all([ read(path.join(dir, p)), read(expected) ])
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

  // Timeout:
  setTimeout(() => t.end('test timeout'), 50000)
})

test.cb('--watch dependencies', function (t) {
  let cp

  t.plan(2)

  ENV('', ['import.css', 'a.css'])
    .then((dir) => {
    // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true
      })

      // On the first output:
      watcher.on('add', (p) => {
        // Assert, then change the source file
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/a.css')
            .then(() => read('test/fixtures/b.css'))
            .then(css => fs.writeFile(path.join(dir, 'a.css'), css))
            .catch(done)
        }
      })

      // When the change is picked up:
      watcher.on('change', (p) => {
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/b.css')
          .then(() => done())
          .catch(done)
        }
      })

      // Start postcss-cli:
      watcher.on('ready', () => {
        cp = execFile(
          path.resolve('bin/postcss'),
          [
            'import.css',
            '-o', 'output.css',
            '-u', 'postcss-import',
            '-w',
            '--no-map'
          ],
          { cwd: dir }
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

  // Timeout:
  setTimeout(() => t.end('test timeout'), 50000)
})
