import test from 'ava'

import fs from 'fs-extra'
import path from 'path'
import { exec, execFile } from 'child_process'
import chokidar from 'chokidar'

import ENV from './helpers/env.js'
import read from './helpers/read.js'

test.cb('--watch works', t => {
  let cp

  t.plan(2)

  ENV('', ['a.css'])
    .then(dir => {
      // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true
      })

      // On the first output:
      watcher.on('add', p => {
        // Assert, then change the source file
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/a.css')
            .then(() => read('test/fixtures/b.css'))
            .then(css => fs.writeFile(path.join(dir, 'a.css'), css))
            .catch(done)
        }
      })

      // When the change is picked up:
      watcher.on('change', p => {
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/b.css')
            .then(() => done())
            .catch(done)
        }
      })

      // Start postcss-cli:
      watcher.on('ready', () => {
        // Using exec() and quoting "*.css" to test watch's glob handling:
        cp = exec(
          `${path.resolve('bin/postcss')} "*.css" -o output.css --no-map -w`,
          { cwd: dir }
        )
        cp.on('error', t.end)
        cp.on('exit', code => {
          if (code) t.end(code)
        })
      })

      // Helper functions:
      function isEqual(p, expected) {
        return Promise.all([
          read(path.join(dir, p)),
          read(expected)
        ]).then(([a, e]) => t.is(a, e))
      }

      function done(err) {
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

test.cb('--watch postcss.config.js', t => {
  let cp

  t.plan(2)

  ENV('module.exports = {}', ['import.css', 'a.css'])
    .then(dir => {
      // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true
      })

      // On the first output:
      watcher.on('add', p => {
        // Assert, then change the source file
        if (p === 'output.css') {
          read(path.join(dir, p))
            .then(css => {
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
      watcher.on('change', p => {
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
          ['import.css', '-o', 'output.css', '-w', '--no-map'],
          { cwd: dir }
        )

        cp.on('error', t.end)
        cp.on('exit', code => {
          if (code) t.end(code)
        })
      })

      // Helper functions:
      function isEqual(p, expected) {
        return Promise.all([
          read(path.join(dir, p)),
          read(expected)
        ]).then(([a, e]) => t.is(a, e))
      }

      function done(err) {
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

test.cb('--watch dependencies', t => {
  let cp

  t.plan(2)

  ENV('', ['import.css', 'a.css'])
    .then(dir => {
      // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true
      })

      // On the first output:
      watcher.on('add', p => {
        // Assert, then change the source file
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/a.css')
            .then(() => read('test/fixtures/b.css'))
            .then(css => fs.writeFile(path.join(dir, 'a.css'), css))
            .catch(done)
        }
      })

      // When the change is picked up:
      watcher.on('change', p => {
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
            '-o',
            'output.css',
            '-u',
            'postcss-import',
            '-w',
            '--no-map'
          ],
          { cwd: dir }
        )

        cp.on('error', t.end)
        cp.on('exit', code => {
          if (code) t.end(code)
        })
      })

      // Helper functions:
      function isEqual(p, expected) {
        return Promise.all([
          read(path.join(dir, p)),
          read(expected)
        ]).then(([a, e]) => t.is(a, e))
      }

      function done(err) {
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

test.cb("--watch doesn't exit on CssSyntaxError", t => {
  t.plan(0)

  ENV('', ['a.css'])
    .then(dir => {
      // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true
      })
      watcher.on('add', p => {
        if (p === 'output.css') {
          // Change to invalid CSS
          fs.writeFile(path.join(dir, 'a.css'), '.a { color: red').catch(done)
        }
      })

      let killed = false
      const cp = execFile(
        path.resolve('bin/postcss'),
        ['a.css', '-o', 'output.css', '-w', '--no-map'],
        { cwd: dir }
      )
      cp.on('error', t.end)
      cp.stderr.on('data', chunk => {
        // When error message is printed, kill the process after a timeout
        if (~chunk.indexOf('Unclosed block')) {
          setTimeout(() => {
            killed = true
            cp.kill()
          }, 1000)
        }
      })
      cp.on('exit', code => {
        if (!killed) return t.end(`Should not exit (exited with code ${code})`)
        done()
      })

      function done(err) {
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
