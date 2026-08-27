import test from 'ava'

import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import chokidar from 'chokidar'

import ENV from './helpers/env.js'
import read from './helpers/read.js'
import tmp from './helpers/tmp.js'

// XXX: All the tests in this file are skipped on the Windows CI; too flacky there
const maybeTest =
  process.env.CI && process.platform === 'win32' ? test.skip : test

maybeTest('--watch works', async (t) => {
  const { promise, resolve, reject } = Promise.withResolvers()

  t.plan(2)

  const dir = await ENV('', ['a.css'])

  // Init watcher:
  const watcher = chokidar.watch('.', {
    cwd: dir,
    ignoreInitial: true,
    awaitWriteFinish: true,
    persistent: false,
  })

  // On the first output:
  watcher.on('add', (p) => {
    // Assert, then change the source file
    if (p === 'output.css') {
      isEqual(p, 'test/fixtures/a.css')
        .then(() => read('test/fixtures/b.css'))
        .then((css) => fs.writeFile(path.join(dir, 'a.css'), css))
        .catch(reject)
    }
  })

  // When the change is picked up:
  watcher.on('change', (p) => {
    if (p === 'output.css') {
      isEqual(p, 'test/fixtures/b.css').then(resolve, reject)
    }
  })

  // Start postcss-cli:
  watcher.on('ready', () => {
    let processRunning = true
    const cp = spawn(
      'node',
      [
        path.resolve('index.js'),
        // '*.css' arrives as a single literal arg to test watch's glob handling
        '*.css',
        '-o',
        'output.css',
        '--no-map',
        '-w',
      ],
      { cwd: dir },
    )
    const cleanup = () => {
      try {
        if (processRunning) cp.kill()
      } catch {}
    }
    promise.then(cleanup, cleanup)
    cp.on('error', (err) => {
      processRunning = false
      reject(err)
    })
    cp.on('exit', (code) => {
      processRunning = false
      if (code) reject(`postcss-cli exited with code ${code}`)
    })
  })

  await promise

  // Helper functions:
  function isEqual(p, expected) {
    return Promise.all([read(path.join(dir, p)), read(expected)]).then(
      ([a, e]) => t.is(a, e),
    )
  }
})

maybeTest('--watch postcss-import dependencies', async (t) => {
  const { promise, resolve, reject } = Promise.withResolvers()

  t.plan(2)

  const dir = await ENV('', ['import.css', 'a.css'])
  // Init watcher:
  const watcher = chokidar.watch('.', {
    cwd: dir,
    ignoreInitial: true,
    awaitWriteFinish: true,
    persistent: false,
  })

  // On the first output:
  watcher.on('add', (p) => {
    // Assert, then change the source file
    if (p === 'output.css') {
      isEqual(p, 'test/fixtures/a.css')
        .then(() => read('test/fixtures/b.css'))
        .then((css) => fs.writeFile(path.join(dir, 'a.css'), css))
        .catch(reject)
    }
  })

  // When the change is picked up:
  watcher.on('change', (p) => {
    if (p === 'output.css') {
      isEqual(p, 'test/fixtures/b.css').then(resolve, reject)
    }
  })

  // Start postcss-cli:
  watcher.on('ready', () => {
    let processRunning = true
    const cp = spawn(
      'node',
      [
        path.resolve('index.js'),
        'import.css',
        '-o',
        'output.css',
        '-u',
        'postcss-import',
        '-w',
        '--no-map',
      ],
      { cwd: dir },
    )
    const cleanup = () => {
      try {
        if (processRunning) cp.kill()
      } catch {}
    }
    promise.then(cleanup, cleanup)
    cp.on('error', (err) => {
      processRunning = false
      reject(err)
    })
    cp.on('exit', (code) => {
      processRunning = false
      if (code) reject(`postcss-cli exited with code ${code}`)
    })
  })

  await promise

  // Helper functions:
  function isEqual(p, expected) {
    return Promise.all([read(path.join(dir, p)), read(expected)]).then(
      ([a, e]) => t.is(a, e),
    )
  }
})

maybeTest("--watch doesn't exit on CssSyntaxError", async (t) => {
  const { promise, resolve, reject } = Promise.withResolvers()

  t.plan(0)

  const dir = await ENV('', ['a.css'])
  // Init watcher:
  const watcher = chokidar.watch('.', {
    cwd: dir,
    ignoreInitial: true,
    awaitWriteFinish: true,
    persistent: false,
  })
  watcher.on('add', (p) => {
    if (p === 'output.css') {
      // Change to invalid CSS
      fs.writeFile(path.join(dir, 'a.css'), '.a { color: red').catch(reject)
    }
  })

  let killed = false
  const cp = spawn(
    'node',
    [
      path.resolve('index.js'),
      'a.css',
      '-o',
      'output.css',
      '-u',
      'postcss-import',
      '-w',
      '--no-map',
    ],
    { cwd: dir },
  )
  cp.on('error', reject)
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
    if (!killed) reject(`Should not exit (exited with code ${code})`)
    else resolve()
  })

  await promise
})

maybeTest('--watch does exit on closing stdin (Ctrl-D/EOF)', async (t) => {
  const { promise, resolve, reject } = Promise.withResolvers()

  t.plan(1)

  const cp = spawn(
    'node',
    [
      path.resolve('index.js'),
      'test/fixtures/a.css',
      '-o',
      tmp(),
      '-w',
      '--no-map',
    ],
    {
      env: {
        ...process.env,
        FORCE_IS_TTY: true,
      },
    },
  )

  cp.on('error', reject)
  cp.on('exit', (code) => {
    t.is(code, 0)
    resolve()
  })

  cp.stdin.end()

  await promise
})

maybeTest('--watch watches dependencies', async (t) => {
  const { promise, resolve, reject } = Promise.withResolvers()

  t.plan(2)

  const dir = await ENV('', ['s.css', 'a.css', 'b.css'])
  await fs.writeFile(
    path.join(dir, 'postcss.config.cjs'),
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
      `,
  )

  // Init watcher:
  const watcher = chokidar.watch('.', {
    cwd: dir,
    ignoreInitial: true,
    awaitWriteFinish: true,
    persistent: false,
  })

  // On the first output:
  watcher.on('add', (p) => {
    // Assert, then change the source file
    if (p === 'output.css') {
      isEqual(p, 'test/fixtures/a.css')
        .then(() => read('test/fixtures/b.css'))
        .then((css) => fs.writeFile(path.join(dir, 'a.css'), css))
        .catch(reject)
    }
  })

  // When the change is picked up:
  watcher.on('change', (p) => {
    if (p === 'output.css') {
      isEqual(p, 'test/fixtures/b.css').then(resolve, reject)
    }
  })

  // Start postcss-cli:
  watcher.on('ready', () => {
    let processRunning = true

    const cp = spawn(
      'node',
      [path.resolve('index.js'), 's.css', '-o', 'output.css', '--no-map', '-w'],
      { cwd: dir },
    )
    const cleanup = () => {
      try {
        if (processRunning) cp.kill()
      } catch {}
    }
    promise.then(cleanup, cleanup)
    cp.on('error', (err) => {
      processRunning = false
      reject(err)
    })
    cp.on('exit', (code) => {
      processRunning = false
      if (code) reject(`postcss-cli exited with code ${code}`)
    })
  })

  await promise

  // Helper functions:
  function isEqual(p, expected) {
    return Promise.all([read(path.join(dir, p)), read(expected)]).then(
      ([a, e]) => t.is(a, e),
    )
  }
})

maybeTest('--watch watches directory dependencies', async (t) => {
  const { promise, resolve, reject } = Promise.withResolvers()

  t.plan(2)

  const dir = await ENV('', [
    's.css',
    'base/level-1/b.css',
    'base/level-1/level-2/a.css',
  ])
  await fs.writeFile(
    path.join(dir, 'postcss.config.cjs'),
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
            'base/level-1/level-2/a.css',
          )}', 'utf8'))
          return root
        }
      ]
    }
    `,
  )
  // Init watcher:
  const watcher = chokidar.watch('.', {
    cwd: dir,
    ignoreInitial: true,
    awaitWriteFinish: true,
    persistent: false,
  })

  // On the first output:
  watcher.on('add', (p) => {
    // Assert, then change the source file
    if (p === 'output.css') {
      isEqual(p, 'test/fixtures/base/level-1/level-2/a.css')
        .then(() => read('test/fixtures/base/level-1/b.css'))
        .then((css) =>
          fs.writeFile(path.join(dir, 'base/level-1/level-2/a.css'), css),
        )
        .catch(reject)
    }
  })

  // When the change is picked up:
  watcher.on('change', (p) => {
    if (p === 'output.css') {
      isEqual(p, 'test/fixtures/base/level-1/b.css').then(resolve, reject)
    }
  })

  // Start postcss-cli:
  watcher.on('ready', () => {
    let processRunning = true

    const cp = spawn(
      'node',
      [path.resolve('index.js'), 's.css', '-o', 'output.css', '--no-map', '-w'],
      { cwd: dir },
    )
    const cleanup = () => {
      try {
        if (processRunning) cp.kill()
      } catch {}
    }
    promise.then(cleanup, cleanup)
    cp.on('error', (err) => {
      processRunning = false
      reject(err)
    })
    cp.on('exit', (code) => {
      processRunning = false
      if (code) reject(`postcss-cli exited with code ${code}`)
    })
  })

  await promise

  // Helper functions:
  function isEqual(p, expected) {
    return Promise.all([read(path.join(dir, p)), read(expected)]).then(
      ([a, e]) => t.is(a, e),
    )
  }
})

maybeTest(
  '--watch applies glob on dir-dependency (and excludes non matching files)',
  async (t) => {
    const { promise, resolve, reject } = Promise.withResolvers()
    let modifying = null // one of "unrelated.md", "a.css"

    t.plan(1)

    const dir = await ENV('', [
      's.css',
      'base/level-1/b.css',
      'base/level-1/level-2/a.css',
      'base/level-1/level-2/unrelated.md',
    ])
    await fs.writeFile(
      path.join(dir, 'postcss.config.cjs'),
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
            'base/level-1/level-2/a.css',
          )}', 'utf8'))
          return root
        }
      ]
    }
    `,
    )

    // Init watcher:
    const watcher = chokidar.watch('.', {
      cwd: dir,
      ignoreInitial: true,
      awaitWriteFinish: true,
      persistent: false,
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
          `Unexpected change to ${p} after modifying ${modifying}`,
        )
        resolve()
      } else if (p === 'base/level-1/level-2/unrelated.md') {
        // Modify watched file next, should trigger output
        setTimeout(modifyWatched, 250)
      }
    })

    // Start postcss-cli:
    watcher.on('ready', () => {
      let processRunning = true

      const cp = spawn(
        'node',
        [
          path.resolve('index.js'),
          's.css',
          '-o',
          'output.css',
          '--no-map',
          '-w',
        ],
        { cwd: dir },
      )
      const cleanup = () => {
        try {
          if (processRunning) cp.kill()
        } catch {}
      }
      promise.then(cleanup, cleanup)
      cp.on('error', (err) => {
        processRunning = false
        reject(err)
      })
      cp.on('exit', (code) => {
        processRunning = false
        if (code) reject(`postcss-cli exited with code ${code}`)
      })
    })

    await promise

    // Helper functions:
    function modifyUnwatched() {
      modifying = 'unrelated.md'
      fs.writeFile(
        path.join(dir, 'base/level-1/level-2/unrelated.md'),
        'Some modification',
      ).catch(reject)
    }

    function modifyWatched() {
      modifying = 'a.css'
      fs.writeFile(
        path.join(dir, 'base/level-1/level-2/a.css'),
        'a { color: hotpink }',
      ).catch(reject)
    }
  },
)
