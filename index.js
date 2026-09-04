#!/usr/bin/env node

import path from 'node:path'
import { text } from 'node:stream/consumers'
import prettyHrtime from 'pretty-hrtime'
import read from 'read-cache'
import pc from 'picocolors'
import { glob } from 'tinyglobby'
import slash from 'slash'
import chokidar from 'chokidar'

import postcss from 'postcss'
import postcssrc from 'postcss-load-config'
import postcssReporter from 'postcss-reporter/lib/formatter.js'

import argv from './lib/args.js'
import createDependencyGraph from './lib/DependencyGraph.js'
import getMapfile from './lib/getMapfile.js'
import outputFile from './lib/outputFile.js'

const reporter = postcssReporter()
const depGraph = createDependencyGraph()

const expandGlob = async (patterns) => {
  if (!Array.isArray(patterns)) patterns = [patterns]

  const paths = await glob(
    patterns.map((i) => slash(String(i))),
    { dot: argv.includeDotfiles },
  )

  return paths.map((i) => path.resolve(i))
}

let input = argv._
const { dir, output, replace } = argv

if (argv.map) argv.map = { inline: false }

// will be just one config file in the vast majority of cases
const configFiles = new Set()
let argvConfigSet = false

if (argv.env) process.env.NODE_ENV = argv.env
if (argv.config) {
  argvConfigSet = true
  argv.config = path.resolve(argv.config)
}

let { isTTY } = process.stdin

if (process.env.FORCE_IS_TTY === 'true') {
  isTTY = true
}

if (argv.watch && isTTY) {
  process.stdin.on('end', () => process.exit(0))
  process.stdin.resume()
}

/* istanbul ignore next */
if (parseInt(postcss().version) < 8) {
  error('Please install PostCSS 8 or above')
}

const cliConfig = {
  options: {
    map: argv.map !== undefined ? argv.map : { inline: true },
    parser: argv.parser ? await import(argv.parser) : undefined,
    syntax: argv.syntax ? await import(argv.syntax) : undefined,
    stringifier: argv.stringifier ? await import(argv.stringifier) : undefined,
  },
  plugins: argv.use
    ? await Promise.all(
        argv.use.map(async (plugin) => {
          try {
            return (await import(plugin)).default()
          } catch (e) {
            const msg = e.message || `Unknown error in '${plugin}'`
            let prefix = msg.includes(plugin) ? '' : ` (${plugin})`
            if (e.name && e.name !== 'Error') prefix += `: ${e.name}`
            error(`Plugin Error${prefix}: ${msg}`)
          }
        }),
      )
    : [],
}

if (argv.watch && !(output || replace || dir)) {
  error('Cannot write to stdout in watch mode')
}

if (input && input.length) {
  input = await expandGlob(input)

  if (!input.length) {
    error('Input Error: You must pass a valid list of files to parse')
  }

  if (input.length > 1 && !dir && !replace) {
    error('Input Error: Must use --dir or --replace with multiple input files')
  }
} else {
  if (replace || dir) {
    error('Input Error: Cannot use --dir or --replace when reading from stdin')
  }

  if (argv.watch) {
    error('Input Error: Cannot run in watch mode when reading from stdin')
  }

  input = ['stdin']
}

try {
  const results = await files(input)

  if (argv.watch) {
    const printMessage = () =>
      printVerbose(pc.dim('\nWaiting for file changes...'))
    const deps = await dependencies(results)
    const watcher = chokidar.watch(input.concat(deps), {
      usePolling: argv.poll,
      interval: argv.poll && typeof argv.poll === 'number' ? argv.poll : 100,
      awaitWriteFinish: {
        stabilityThreshold: 50,
        pollInterval: 10,
      },
    })

    if (configFiles.size) watcher.add([...configFiles])

    watcher.on('ready', printMessage).on('change', (file) => {
      let recompile = []

      // if it's a config file, skip to recompiling everything
      if (!configFiles.has(file)) {
        if (input.includes(file)) recompile.push(file)

        const dependants = depGraph
          .dependantsOf(file)
          .concat(getAncestorDirs(file).flatMap(depGraph.dependantsOf))

        recompile = recompile.concat(
          dependants.filter((file) => input.includes(file)),
        )
      }

      if (!recompile.length) recompile = input

      return files([...new Set(recompile)])
        .then((results) => dependencies(results))
        .then((deps) => watcher.add(deps))
        .then(printMessage)
        .catch((err) => {
          // Watch mode shouldn't exit on file processing error
          error(err, argv.watch)
        })
    })
  }
} catch (err) {
  error(err)
}

function rc(ctx, path) {
  if (argv.use) return Promise.resolve(cliConfig)

  return postcssrc(ctx, path)
    .then((rc) => {
      if (rc.options.from || rc.options.to) {
        error(
          'Config Error: Can not set from or to options in config file, use CLI arguments instead',
        )
      }
      configFiles.add(rc.file)
      return rc
    })
    .catch((err) => {
      // if a config path is passed explicitly in CLI do not ignore the error
      if (!err.message.includes('No PostCSS Config found') || argvConfigSet) {
        throw err
      }
    })
}

function files(files) {
  return Promise.all(
    files.map((file) => {
      if (file === 'stdin') {
        return text(process.stdin).then((content) => {
          if (!content) return error('Input Error: Did not receive any STDIN')
          return css(content, 'stdin')
        })
      }

      return read(file).then((content) => css(content, file))
    }),
  )
}

async function css(css, file) {
  const ctx = { options: cliConfig.options }

  if (file !== 'stdin') {
    ctx.file = {
      dirname: path.dirname(file),
      basename: path.basename(file),
      extname: path.extname(file),
    }
  }

  const relativePath =
    file !== 'stdin' ? path.relative(path.resolve(), file) : file

  const configDir = argv.config || ctx.file?.dirname || process.cwd()

  const time = process.hrtime()

  printVerbose(pc.cyan(`Processing ${pc.bold(relativePath)}...`))

  const config = (await rc(ctx, configDir)) || cliConfig
  const options = { ...config.options }

  if (file === 'stdin' && output) file = output

  // TODO: Unit test this
  options.from = file === 'stdin' ? path.join(process.cwd(), 'stdin') : file

  if (output || dir || replace) {
    const base = argv.base
      ? file.replace(path.resolve(argv.base), '')
      : path.basename(file)
    options.to = output || (replace ? file : path.join(dir, base))

    if (argv.ext) {
      options.to = options.to.replace(path.extname(options.to), argv.ext)
    }

    options.to = path.resolve(options.to)
  }

  if (!options.to && config.options.map && !config.options.map.inline) {
    error(
      'Output Error: Cannot output external sourcemaps when writing to STDOUT',
    )
  }

  const result = await postcss(config.plugins).process(css, options)
  const tasks = []

  if (options.to) {
    tasks.push(outputFile(options.to, result.css))

    if (result.map) {
      const mapfile = getMapfile(options)
      tasks.push(outputFile(mapfile, result.map.toString()))
    }
  } else process.stdout.write(result.css, 'utf8')

  await Promise.all(tasks)
  const prettyTime = prettyHrtime(process.hrtime(time))
  printVerbose(
    pc.green(`Finished ${pc.bold(relativePath)} in ${pc.bold(prettyTime)}`),
  )

  const messages = result.warnings()
  if (messages.length) {
    console.warn(reporter({ ...result, messages }))
  }

  return result
}

async function dependencies(results) {
  if (!Array.isArray(results)) results = [results]

  const depArrays = await Promise.all(
    results.map(async (result) => {
      if (result.messages.length <= 0) return []

      return Promise.all(
        result.messages
          .filter(
            (msg) => msg.type === 'dependency' || msg.type === 'dir-dependency',
          )
          .map(depGraph.add)
          .map(async (dependency) => {
            if (dependency.type === 'dir-dependency') {
              return dependency.glob
                ? await expandGlob(path.join(dependency.dir, dependency.glob))
                : dependency.dir
            }

            return dependency.file
          }),
      )
    }),
  )

  // depth of 2 is needed because glob dir-dependency can return an array of files
  return depArrays.flat(2)
}

function printVerbose(message) {
  if (argv.verbose) console.warn(message)
}

function error(err, dontExit) {
  // Seperate error from logging output
  if (argv.verbose) console.error()

  if (typeof err === 'string') {
    console.error(pc.red(err))
  } else if (err.name === 'CssSyntaxError') {
    console.error(err.toString())
  } else {
    console.error(err)
  }
  if (dontExit) return
  process.exit(1)
}

// Input: '/imports/components/button.css'
// Output: ['/imports/components', '/imports', '/']
function getAncestorDirs(file) {
  const { root } = path.parse(file)
  const ancestors = []
  let current = file

  while (current !== root) {
    current = path.dirname(current)
    ancestors.push(current)
  }

  return ancestors
}
