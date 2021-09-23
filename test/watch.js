'use strict'
const test = require('ava')

const fs = require('fs-extra')
const path = require('path')
const { exec, spawn } = require('child_process')
const chokidar = require('chokidar')

const ENV = require('./helpers/env.js')
const read = require('./helpers/read.js')
const tmp = require('./helpers/tmp.js')

// XXX: All the tests in this file are skipped on the CI; too flacky there
const testCb = process.env.CI ? test.cb.skip : test.cb

testCb('--watch works', (t) => {
  let cp

  t.plan(2)

  ENV('', ['a.css'])
    .then((dir) => {
      // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true,
      })

      // On the first output:
      watcher.on('add', (p) => {
        // Assert, then change the source file
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/a.css')
            .then(() => read('test/fixtures/b.css'))
            .then((css) => fs.writeFile(path.join(dir, 'a.css'), css))
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
        // Using exec() and quoting "*.css" to test watch's glob handling:
        cp = exec(
          `node ${path.resolve(
            'bin/postcss'
          )} "*.css" -o output.css --no-map -w`,
          { cwd: dir }
        )
        cp.on('error', t.end)
        cp.on('exit', (code) => {
          if (code) t.end(code)
        })
      })

      // Helper functions:
      function isEqual(p, expected) {
        return Promise.all([read(path.join(dir, p)), read(expected)]).then(
          ([a, e]) => t.is(a, e)
        )
      }

      function done(err) {
        try {
          cp.kill()
        } catch {}

        t.end(err)
      }
    })
    .catch(t.end)

  // Timeout:
  setTimeout(() => t.end('test timeout'), 50000)
})

testCb('--watch dependencies', (t) => {
  let cp

  t.plan(2)

  ENV('', ['import.css', 'a.css'])
    .then((dir) => {
      // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true,
      })

      // On the first output:
      watcher.on('add', (p) => {
        // Assert, then change the source file
        if (p === 'output.css') {
          isEqual(p, 'test/fixtures/a.css')
            .then(() => read('test/fixtures/b.css'))
            .then((css) => fs.writeFile(path.join(dir, 'a.css'), css))
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
        cp = exec(
          `node ${path.resolve(
            'bin/postcss'
          )} import.css -o output.css -u postcss-import -w --no-map`,
          { cwd: dir }
        )

        cp.on('error', t.end)
        cp.on('exit', (code) => {
          if (code) t.end(code)
        })
      })

      // Helper functions:
      function isEqual(p, expected) {
        return Promise.all([read(path.join(dir, p)), read(expected)]).then(
          ([a, e]) => t.is(a, e)
        )
      }

      function done(err) {
        try {
          cp.kill()
        } catch {}
        t.end(err)
      }
    })
    .catch(t.end)

  // Timeout:
  setTimeout(() => t.end('test timeout'), 50000)
})

testCb("--watch doesn't exit on CssSyntaxError", (t) => {
  t.plan(0)

  ENV('', ['a.css'])
    .then((dir) => {
      // Init watcher:
      const watcher = chokidar.watch('.', {
        cwd: dir,
        ignoreInitial: true,
        awaitWriteFinish: true,
      })
      watcher.on('add', (p) => {
        if (p === 'output.css') {
          // Change to invalid CSS
          fs.writeFile(path.join(dir, 'a.css'), '.a { color: red').catch(done)
        }
      })

      let killed = false
      const cp = exec(
        `node ${path.resolve('bin/postcss')} a.css -o output.css -w --no-map`,
        { cwd: dir }
      )
      cp.on('error', t.end)
      cp.stderr.on('data', (chunk) => {
        // When error message is printed, kill the process after a timeout
        if (~chunk.indexOf('Unclosed block')) {
          setTimeout(() => {
            killed = true
            cp.kill()
          }, 1000)
        }
      })
      cp.on('exit', (code) => {
        if (!killed) return t.end(`Should not exit (exited with code ${code})`)
        done()
      })

      function done(err) {
        try {
          cp.kill()
        } catch {}

        t.end(err)
      }
    })
    .catch(t.end)

  // Timeout:
  setTimeout(() => t.end('test timeout'), 50000)
})

testCb('--watch does exit on closing stdin (Ctrl-D/EOF)', (t) => {
  t.plan(1)

  const cp = spawn(
    `./bin/postcss test/fixtures/a.css -o ${tmp()} -w --no-map`,
    { shell: true }
  )

  cp.on('error', t.end)
  cp.on('exit', (code) => {
    t.is(code, 0)
    t.end()
  })
  cp.stdin.end()
})

testCb('--watch watches dependencies', (t) => {
  let cp

  t.plan(2)

  ENV('', ['s.css', 'a.css', 'b.css']).then((dir) => {
    fs.writeFile(
      path.join(dir, 'postcss.config.js'),
      `
        const fs = require('fs')
        module.exports = {
          plugins: [
            (root, result) => {
              const file = '${path.resolve(dir, 'a.css')}'
              result.messages.push({
                plugin: 'test',
                type: 'dependency',
                file,
                parent: result.opts.from,
              })
              root.nodes = []
              root.append(fs.readFileSync(file, 'utf8'))
              return root
            }
          ]
        }
      `
    )
      .then(() => {
        // Init watcher:
        const watcher = chokidar.watch('.', {
          cwd: dir,
          ignoreInitial: true,
          awaitWriteFinish: true,
        })

        // On the first output:
        watcher.on('add', (p) => {
          // Assert, then change the source file
          if (p === 'output.css') {
            isEqual(p, 'test/fixtures/a.css')
              .then(() => read('test/fixtures/b.css'))
              .then((css) => fs.writeFile(path.join(dir, 'a.css'), css))
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
          // Using exec() and quoting "*.css" to test watch's glob handling:
          cp = exec(
            `node ${path.resolve(
              'bin/postcss'
            )} "s.css" -o output.css --no-map -w`,
            { cwd: dir }
          )
          cp.on('error', t.end)
          cp.on('exit', (code) => {
            if (code) t.end(code)
          })
        })

        // Helper functions:
        function isEqual(p, expected) {
          return Promise.all([read(path.join(dir, p)), read(expected)]).then(
            ([a, e]) => t.is(a, e)
          )
        }

        function done(err) {
          try {
            cp.kill()
          } catch {}

          t.end(err)
        }
      })
      .catch(t.end)
  })

  // Timeout:
  setTimeout(() => t.end('test timeout'), 50000)
})

testCb('--watch watches directory dependencies', (t) => {
  let cp

  t.plan(2)

  ENV('', ['s.css', 'base/level-1/b.css', 'base/level-1/level-2/a.css']).then(
    (dir) => {
      fs.writeFile(
        path.join(dir, 'postcss.config.js'),
        `
          const fs = require('fs')
          module.exports = {
            plugins: [
              (root, result) => {
                result.messages.push({
                  plugin: 'test',
                  type: 'dir-dependency',
                  dir: '${path.resolve(dir, 'base')}',
                  parent: result.opts.from,
                })
                root.nodes = []
                root.append(fs.readFileSync('${path.resolve(
                  dir,
                  'base/level-1/level-2/a.css'
                )}', 'utf8'))
                return root
              }
            ]
          }
        `
      )
        .then(() => {
          // Init watcher:
          const watcher = chokidar.watch('.', {
            cwd: dir,
            ignoreInitial: true,
            awaitWriteFinish: true,
          })

          // On the first output:
          watcher.on('add', (p) => {
            // Assert, then change the source file
            if (p === 'output.css') {
              isEqual(p, 'test/fixtures/base/level-1/level-2/a.css')
                .then(() => read('test/fixtures/base/level-1/b.css'))
                .then((css) =>
                  fs.writeFile(
                    path.join(dir, 'base/level-1/level-2/a.css'),
                    css
                  )
                )
                .catch(done)
            }
          })

          // When the change is picked up:
          watcher.on('change', (p) => {
            if (p === 'output.css') {
              isEqual(p, 'test/fixtures/base/level-1/b.css')
                .then(() => done())
                .catch(done)
            }
          })

          // Start postcss-cli:
          watcher.on('ready', () => {
            // Using exec() and quoting "*.css" to test watch's glob handling:
            cp = exec(
              `node ${path.resolve(
                'bin/postcss'
              )} "s.css" -o output.css --no-map -w`,
              { cwd: dir }
            )
            cp.on('error', t.end)
            cp.on('exit', (code) => {
              if (code) t.end(code)
            })
          })

          // Helper functions:
          function isEqual(p, expected) {
            return Promise.all([read(path.join(dir, p)), read(expected)]).then(
              ([a, e]) => t.is(a, e)
            )
          }

          function done(err) {
            try {
              cp.kill()
            } catch {}

            t.end(err)
          }
        })
        .catch(t.end)
    }
  )

  // Timeout:
  setTimeout(() => t.end('test timeout'), 50000)
})

testCb(
  '--watch applies glob on dir-dependency (and excludes non matching files)',
  (t) => {
    let cp
    let modifying = null // one of "unrelated.md", "a.css"

    t.plan(1)

    ENV('', [
      's.css',
      'base/level-1/b.css',
      'base/level-1/level-2/a.css',
      'base/level-1/level-2/unrelated.md',
    ]).then((dir) => {
      fs.writeFile(
        path.join(dir, 'postcss.config.js'),
        `
          const fs = require('fs')
          module.exports = {
            plugins: [
              (root, result) => {
                result.messages.push({
                  plugin: 'test',
                  type: 'dir-dependency',
                  dir: '${path.resolve(dir, 'base')}',
                  glob: '**/*.css',
                  parent: result.opts.from,
                })
                root.nodes = []
                root.append(fs.readFileSync('${path.resolve(
                  dir,
                  'base/level-1/level-2/a.css'
                )}', 'utf8'))
                return root
              }
            ]
          }
        `
      )
        .then(() => {
          // Init watcher:
          const watcher = chokidar.watch('.', {
            cwd: dir,
            ignoreInitial: true,
            awaitWriteFinish: true,
          })

          // On the first output:
          watcher.on('add', (p) => {
            if (p === 'output.css') {
              // Modify unwatched file, shouldn't trigger output
              modifyUnwatched()
            }
          })

          // When the change is picked up:
          watcher.on('change', (p) => {
            if (p === 'output.css') {
              // Assert that change to output.css happened only after modifying the watched a.css
              t.is(
                modifying,
                'a.css',
                `Unexpected change to ${p} after modifying ${modifying}`
              )
              done()
            } else if (p === 'base/level-1/level-2/unrelated.md') {
              // Modify watched file next, should trigger output
              setTimeout(modifyWatched, 250)
            }
          })

          // Start postcss-cli:
          watcher.on('ready', () => {
            cp = exec(
              `node ${path.resolve(
                'bin/postcss'
              )} "s.css" -o output.css --no-map -w`,
              { cwd: dir }
            )
            cp.on('error', t.end)
            cp.on('exit', (code) => {
              if (code) t.end(code)
            })
          })

          function modifyUnwatched() {
            modifying = 'unrelated.md'
            fs.writeFile(
              path.join(dir, 'base/level-1/level-2/unrelated.md'),
              'Some modification'
            ).catch(done)
          }

          function modifyWatched() {
            modifying = 'a.css'
            fs.writeFile(
              path.join(dir, 'base/level-1/level-2/a.css'),
              'a { color: hotpink }'
            ).catch(done)
          }

          function done(err) {
            try {
              cp.kill()
            } catch {}

            t.end(err)
          }
        })
        .catch(t.end)
    })

    // Timeout:
    setTimeout(() => t.end('test timeout'), 50000)
  }
)
