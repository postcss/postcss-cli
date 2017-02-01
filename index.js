'use strict'

const fs = require('fs-promise')
const path = require('path')

const stdin = require('get-stdin')
const stream = require('stream')

const chalk = require('chalk')
const spinner = require('ora')()
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

let config = {
  options: {
    parser: argv.parser ? require(argv.parser) : undefined,
    syntax: argv.syntax ? require(argv.syntax) : undefined,
    stringifier: argv.stringifier ? require(argv.stringifier) : undefined
  },
  plugins: argv.use ? argv.use.map(plugin => require(plugin)) : []
}

if (argv.env) process.env.NODE_ENV = argv.env
if (argv.config) argv.config = path.resolve(argv.config)

console.warn(chalk.bold.red(logo))

Promise.resolve()
  .then(() => {
    if (input && input.length) return globber(input)

    console.warn(chalk.bold.yellow('\nWarning: No files passed, reading from stdin\n'))

    if (argv.watch) {
      throw new Error('Cannot run in watch mode when reading from stdin')
    }

    return ['-']
  })
  .then((i) => {
    if (!i || !i.length) {
      throw new Error('You must pass a valid list of files to parse')
    }

    if (i.length > 1 && argv.output && !argv.concat) {
      throw new Error('Must use --dir or --replace with multiple input files')
    }

    return input
  })
  .then(files)
  .then((results) => {
    if (argv.watch) {
      let watcher = chokidar
        .watch(input.concat(dependencies(results)))

      watcher
        .add(config.file)
        .on('ready', (file) => console.warn('Waiting for file changes...'))
        .on('change', (file) => {
        // If this is not a direct input file, process all:
          if (input.indexOf(file) === -1) {
            return files(input)
              .then((results) => watcher.add(dependencies(results)))
              .catch(error)
          }

          files(file)
            .then((result) => watcher.add(dependencies(result)))
            .catch(error)
        })
    }
  })
  .catch(error)

function rc (ctx, path) {
  if (argv.use) {
    map()
    return Promise.resolve()
  }

  return postcssrc(ctx, path)
    .then((rc) => {
      config = rc
      map()
    })
    .catch((err) => {
      if (err.message.indexOf('No PostCSS Config found') === -1) throw err
    })
}

function map () {
  if (argv.map === false) config.options.map = false
  else if (argv.map) config.options.map = { inline: false }
  else config.options.map = true
}

function files (files) {
  if (typeof files === 'string') files = [ files ]

  if (argv.concat) {
    const concat = []

    files.forEach((file) => {
      concat.push(fs.readFile(file).then((content) => content))
    })

    return Promise.all(concat)
      .then((content) => {
        css(content.join('\n'), path.resolve(output))
      })
  }

  return Promise.all(files.map((file) => {
    // Read from stdin
    if (file === '-') {
      return stdin()
        .then((content) => css(content, 'stdin'))
    }

    return fs.readFile(file)
      .then((content) => css(content, file))
  }))
}

function css (css, file) {
  const ctx = { options: {} }

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

  spinner.text = `Processing ${file}`
  spinner.start()

  rc(ctx, argv.config)
    .then(() => {
      let options

      if (file !== 'stdin') {
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

          if (file !== 'stdin' || output) {
            const results = [ fs.outputFile(options.to, result.css) ]

            if (result.map) {
              results.push(
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

            return Promise.all(results)
              .then(() => {
                spinner.text = chalk.bold.green(
                  `Finished ${file} (${Math.round(process.hrtime(time)[1] / 1e6)}ms)`
                )
                spinner.succeed()

                return result
              })
          }

          const $ = new stream.Writable({
            write: (chunk, enc, cb) => cb(chunk.toString())
          })

          $.write(result.css)

          if (result.map) $.write(result.map)

          spinner.text = chalk.bold.green(
            `Finished ${file} (${Math.round(process.hrtime(time)[1] / 1e6)}ms)`
          )
          spinner.succeed()

          return $.pipe(process.stdout)
        })
    })
    .catch(error)
}

function dependencies (results) {
  if (!Array.isArray(results)) results = [ results ]

  let messages = []

  results.forEach((result) => {
    return result.messages
      .filter((msg) => msg.type === 'dependency' ? msg.file : '')
      .forEach((dependency) => messages.push(dependency))
  })

  return messages
}

function error (err) {
  // Syntax Error
  if (err.name === 'CssSyntaxError') {
    spinner.text = chalk.bold.red(`${err.file}`)
    spinner.fail()

    err.message = err.message
      .substr(err.file.length + 1)
      .replace(/:\s/, '] ')

    console.error('\n', chalk.bold.red(`[${err.message}`))
    console.error('\n', err.showSourceCode(), '\n')

    process.exit(1)
  }
  // Error
  spinner.text = chalk.bold.red(`${err}\n`)
  spinner.fail()

  process.exit(1)
}
