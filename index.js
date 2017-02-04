'use strict'

const fs = require('fs-promise')
const path = require('path')

const stdin = require('get-stdin')
const Readable = require('stream').Readable

const chalk = require('chalk')
const ora = require('ora')
const globber = require('globby')
const chokidar = require('chokidar')

const postcss = require('postcss')
const postcssrc = require('postcss-load-config')

const logo = `
                                      /|\\
                                    //   //
                                  //       //
                                //___*___*___//
                              //--*---------*--//
                            /|| *             * ||/
                          // ||*               *|| //
                        //   || *             * ||   //
                      //_____||___*_________*___||_____//
`

const version = () => {
  const cli = require('./package.json').version

  return chalk.bold.red(`
                                      /|\\
                                    //   //
                                  //       //
                                //___*___*___//
                              //--*---------*--//
                            /|| *             * ||/
                          // ||*    v${cli}     *|| //
                        //   || *             * ||   //
                      //_____||___*_________*___||_____//
  `)
}

const argv = require('yargs')
  .usage(`${chalk.bold.red(logo)}\nUsage: \n\n$0 [--config|-c path/to/postcss.config.js] [input.css] [--output|-o output.css] [-watch|-w]`)
  .alias('e', 'env').describe('e', 'Environment')
  .alias('x', 'ext').describe('x', 'Extension')
  .alias('c', 'config').describe('c', 'Config')
  .alias('o', 'output').describe('o', 'Output')
    .describe('concat', 'Concat Input')
  .alias('d', 'dir').describe('d', 'Output Directory')
  .alias('r', 'replace').describe('r', 'Replace File')
  .alias('m', 'map')
    .describe('m', 'External Sourcemap')
    .describe('no-map', 'Disable Sourcemaps')
  .alias('b', 'concat').describe('b', 'Concat Input')
  .alias('u', 'use').describe('u', 'Plugin(s)').array('u')
  .alias('p', 'parser').describe('p', 'Parser')
  .alias('s', 'syntax').describe('s', 'Syntax')
  .alias('t', 'stringifier').describe('t', 'Stringifier')
  .alias('w', 'watch').describe('w', 'Watch')
  .help('h').alias('h', 'help')
  .version(version).alias('v', 'version')
  .requiresArg(['i', 'o'])
  .argv

let dir = argv.dir

let input = argv._
let output = argv.output

if (argv.map) argv.map = { inline: false }

console.warn(chalk.bold.red(logo))

let config = {
  options: {
    map: argv.map !== undefined ? argv.map : { inline: true },
    parser: argv.parser ? require(argv.parser) : undefined,
    syntax: argv.syntax ? require(argv.syntax) : undefined,
    stringifier: argv.stringifier ? require(argv.stringifier) : undefined
  },
  plugins: argv.use
    ? argv.use.map((plugin) => {
      try {
        return require(plugin)()
      } catch (e) {
        error(`PluginError: Cannot find module '${plugin}'`)
      }
    })
    : []
}

if (argv.env) process.env.NODE_ENV = argv.env
if (argv.config) argv.config = path.resolve(argv.config)

Promise.resolve()
  .then(() => {
    if (input && input.length) return globber(input)

    console.warn(chalk.bold.yellow('Warning: No files passed, reading from stdin\n'))

    if (argv.watch) {
      error('Cannot run in watch mode when reading from stdin')
    }

    return ['stdin']
  })
  .then((i) => {
    if (!i || !i.length) {
      error('You must pass a valid list of files to parse')
    }

    if (i.length > 1 && !argv.dir && !argv.replace) {
      error('Must use --dir or --replace with multiple input files')
    }

    return i
  })
  .then(files)
  .then((results) => {
    if (argv.watch) {
      const watcher = chokidar.watch(input.concat(dependencies(results)))

      if (config.file) watcher.add(config.file)

      watcher
        .on('ready', (file) => console.warn(chalk.bold.cyan('Waiting for file changes...')))
        .on('change', (file) => {
          if (input.indexOf(file) === -1) {
            return files(input)
              .then((results) => watcher.add(dependencies(results)))
              .then(() => console.warn(chalk.bold.cyan('Waiting for file changes...')))
              .catch(error)
          }

          files(file)
            .then((result) => watcher.add(dependencies(result)))
            .then(() => console.warn(chalk.bold.cyan('Waiting for file changes...')))
            .catch(error)
        })
    }
  })
  .catch(error)

function rc (ctx, path) {
  if (argv.use) return Promise.resolve()

  return postcssrc(ctx, path)
    .then((rc) => { config = rc })
    .catch((err) => {
      if (err.message.indexOf('No PostCSS Config found') === -1) throw err
    })
}

function files (files) {
  if (typeof files === 'string') files = [ files ]

  return Promise.all(files.map((file) => {
    if (file === 'stdin') {
      return stdin()
        .then((content) => {
          if (!content) return error('Error: Did not receive any stdin')
          css(content, 'stdin')
        })
    }

    return fs.readFile(file)
      .then((content) => css(content, file))
  }))
}

function css (css, file) {
  const ctx = { options: config.options }

  if (file !== 'stdin') {
    ctx.file = {
      dirname: path.dirname(file),
      basename: path.basename(file),
      extname: path.extname(file)
    }

    if (!argv.config) argv.config = path.dirname(file)
  }

  if (!argv.config) argv.config = process.cwd()

  const time = process.hrtime()

  const spinner = ora(`Processing ${file}`).start()

  return rc(ctx, argv.config)
    .then(() => {
      let options = config.options

      if (file === 'stdin' && output) file = output

      if (file !== 'stdin' && output || output || dir || argv.replace) {
        options = Object.assign(
          {
            from: file,
            to: output || (
              argv.replace
                ? file
                : path.join(dir, path.basename(file))
            )
          },
          config.options
        )

        if (argv.ext) {
          options.to = options.to
            .replace(path.extname(options.to), argv.ext)
        }

        options.to = path.resolve(options.to)
      }

      return postcss(config.plugins)
        .process(css, options)
        .then((result) => {
          if (result.messages) {
            result.warnings()
              .forEach((warning) => chalk.bold.yellow(`${warning}`))
          }

          const tasks = []

          if (options.to) {
            tasks.push(fs.outputFile(options.to, result.css))

            if (result.map) {
              tasks.push(
                fs.outputFile(
                  options.to
                    .replace(
                      path.extname(options.to),
                      path.extname(options.to) + '.map'
                    ),
                    result.map
                )
              )
            }
          } else {
            const $ = new Readable({ read: (chunk) => chunk })

            result.map
              ? $.push(result.css, result.map)
              : $.push(result.css)

            $.pipe(process.stdout)
          }

          return Promise.all(tasks)
            .then(() => {
              spinner.text = chalk.bold.green(
                `Finished ${file} (${Math.round(process.hrtime(time)[1] / 1e6)}ms)`
              )
              spinner.succeed()

              return result
            })
        })
    })
}

function dependencies (results) {
  if (!Array.isArray(results)) results = [ results ]

  const messages = []

  results.forEach((result) => {
    if (result.messages <= 0) return

    result.messages
      .filter((msg) => msg.type === 'dependency' ? msg : '')
      .forEach((dependency) => messages.push(dependency.file))
  })

  return messages
}

function error (err) {
  if (typeof err === 'string') {
    // Manual error
    console.error(chalk.bold.red(err))
  } else if (err.name === 'CssSyntaxError') {
    // CSS Syntax Error
    console.error(chalk.bold.red(`${err.file}`))
    err.message = err.message
      .substr(err.file.length + 1)
      .replace(/:\s/, '] ')
    console.error('\n', chalk.bold.red(`[${err.message}`))
    console.error('\n', err.showSourceCode(), '\n')
  } else {
    // JS Error
    // Don't use chalk here; we want a JS stack trace:
    console.error(err)
  }
  process.exit(1)
}
