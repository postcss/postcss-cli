'use strict'

const fs = require('fs-promise')
const path = require('path')

const ora = require('ora')
const stdin = require('get-stdin')
const read = require('read-cache')
const chalk = require('chalk')
const globber = require('globby')
const chokidar = require('chokidar')

const postcss = require('postcss')
const postcssrc = require('postcss-load-config')
const reporter = require('postcss-reporter/lib/formatter')()

const depGraph = require('./lib/depGraph')

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
  .usage(
`${chalk.bold.red(logo)}
Usage:

  $0 [input.css] [OPTIONS] [--output|-o output.css] [--watch]`
)
  .option('o', {
    alias: 'output',
    desc: 'Output file',
    type: 'string'
  })
  .option('d', {
    alias: 'dir',
    desc: 'Output directory',
    type: 'string'
  })
  .option('r', {
    alias: 'replace',
    desc: 'Replace (overwrite) the input file',
    type: 'boolean'
  })
  .option('u', {
    alias: 'use',
    desc: 'List of postcss plugins to use',
    type: 'array'
  })
  .option('p', {
    alias: 'parser',
    desc: 'Custom postcss parser',
    type: 'string'
  })
  .option('t', {
    alias: 'stringifier',
    desc: 'Custom postcss stringifier',
    type: 'string'
  })
  .option('s', {
    alias: 'syntax',
    desc: 'Custom postcss syntax',
    type: 'string'
  })
  .option('w', {
    alias: 'watch',
    desc: 'Watch files for changes and recompile as needed',
    type: 'boolean'
  })
  .option('poll', {
    desc: 'Use polling for file watching',
    type: 'boolean'
  })
  .option('x', {
    alias: 'ext',
    desc: 'Override the output file extension',
    type: 'string',
    coerce (ext) {
      if (ext.indexOf('.') !== 0) return '.' + ext
      return ext
    }
  })
  .option('e', {
    alias: 'env',
    desc: 'A shortcut for setting NODE_ENV',
    type: 'string'
  })
  .option('b', {
    alias: 'base',
    desc: 'Mirror the directory structure relative to this path in the output directory, this only works together with --dir',
    type: 'string'
  })
  .option('c', {
    alias: 'config',
    desc: 'Set a custom path to look for a config file',
    type: 'string'
  })
  .alias('m', 'map')
    .describe('m', 'Create an external sourcemap')
    .describe('no-map', 'Disable the default inline sourcemaps')
  .version(version).alias('v', 'version')
  .help('h').alias('h', 'help')
  .example('$0 input.css -o output.css', 'Basic usage')
  .example('cat input.css | $0 -u autoprefixer > output.css', 'Piping input & output')
  .epilog(
`If no input files are passed, it reads from stdin. If neither -o, --dir, or --replace is passed, it writes to stdout.

If there are multiple input files, the --dir or --replace option must be passed.

For more details, please see https://github.com/postcss/postcss-cli`
  )
  .argv

let dir = argv.dir

let input = argv._
let output = argv.output

if (argv.map) argv.map = { inline: false }

const spinner = ora()

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
        error(`Plugin Error: Cannot find module '${plugin}'`)
      }
    })
    : []
}

if (argv.env) process.env.NODE_ENV = argv.env
if (argv.config) argv.config = path.resolve(argv.config)

Promise.resolve()
  .then(() => {
    if (input && input.length) return globber(input)

    if (argv.replace || argv.dir) error('Input Error: Cannot use --dir or --replace when reading from stdin')

    if (argv.watch) {
      error('Input Error: Cannot run in watch mode when reading from stdin')
    }

    return ['stdin']
  })
  .then((i) => {
    if (!i || !i.length) {
      error('Input Error: You must pass a valid list of files to parse')
    }

    if (i.length > 1 && !argv.dir && !argv.replace) {
      error('Input Error: Must use --dir or --replace with multiple input files')
    }

    if (i[0] !== 'stdin') i = i.map(i => path.resolve(i))

    input = i

    return files(input)
  })
  .then((results) => {
    if (argv.watch) {
      const watcher = chokidar.watch(
        input.concat(dependencies(results)),
        { usePolling: argv.poll }
      )

      if (config.file) watcher.add(config.file)

      watcher
        .on('ready', (file) => console.warn(chalk.bold.cyan('Waiting for file changes...')))
        .on('change', (file) => {
          let recompile = []

          if (~input.indexOf(file)) recompile.push(file)

          recompile = recompile.concat(
            depGraph.dependantsOf(file).filter(file => ~input.indexOf(file))
          )

          if (!recompile.length) recompile = input

          return files(recompile)
            .then((results) => watcher.add(dependencies(results)))
            .then(() => console.warn(chalk.bold.cyan('Waiting for file changes...')))
            .catch(error)
        })
    }
  })
  .catch(error)

function rc (ctx, path) {
  if (argv.use) return Promise.resolve()

  return postcssrc(ctx, path)
    .then((rc) => {
      if (rc.options.from || rc.options.to) {
        error('Config Error: Can not set from or to options in config file, use CLI arguments instead')
      }
      config = rc
    })
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
          if (!content) return error('Input Error: Did not receive any STDIN')
          return css(content, 'stdin')
        })
    }

    return read(file)
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

  const relativePath = file !== 'stdin' ? path.relative(path.resolve(), file) : file

  if (!argv.config) argv.config = process.cwd()

  const time = process.hrtime()

  spinner.text = `Processing ${relativePath}`
  spinner.start()

  return rc(ctx, argv.config)
    .then(() => {
      let options = config.options

      if (file === 'stdin' && output) file = output

      // TODO: Unit test this
      options.from = file === 'stdin' ? path.join(process.cwd(), 'stdin') : file

      if (output || dir || argv.replace) {
        options.to = output || (argv.replace ? file : path.join(dir, argv.base ? file.replace(path.resolve(argv.base), '') : path.basename(file)))

        if (argv.ext) {
          options.to = options.to
            .replace(path.extname(options.to), argv.ext)
        }

        options.to = path.resolve(options.to)
      }

      if (!options.to && config.options.map && !config.options.map.inline) {
        spinner.fail()
        error('Output Error: Cannot output external sourcemaps when writing to STDOUT')
      }

      return postcss(config.plugins)
        .process(css, options)
        .then((result) => {
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
            spinner.text = chalk.bold.green(
              `Finished ${relativePath} (${Math.round(process.hrtime(time)[1] / 1e6)}ms)`
            )
            spinner.succeed()
            return process.stdout.write(result.css, 'utf8')
          }

          return Promise.all(tasks)
            .then(() => {
              spinner.text = chalk.bold.green(
                `Finished ${relativePath} (${Math.round(process.hrtime(time)[1] / 1e6)}ms)`
              )
              if (result.warnings().length) {
                spinner.fail()
                console.warn(reporter(result))
              } else spinner.succeed()

              return result
            })
        })
    }).catch((err) => {
      spinner.fail()
      throw err
    })
}

function dependencies (results) {
  if (!Array.isArray(results)) results = [ results ]

  const messages = []

  results.forEach((result) => {
    if (result.messages <= 0) return

    result.messages
      .filter((msg) => msg.type === 'dependency' ? msg : '')
      .map(depGraph.add)
      .forEach((dependency) => messages.push(dependency.file))
  })

  return messages
}

function error (err) {
  if (typeof err === 'string') {
    spinner.fail(chalk.bold.red(err))
  } else if (err.name === 'CssSyntaxError') {
    console.error('\n')

    spinner.text = spinner.text.replace('Processing ', '')
    spinner.fail(chalk.bold.red(`Syntax Error: ${spinner.text}`))

    if (err.file) {
      err.message = err.message.substr(err.file.length + 1)
    } else {
      err.message = err.message.replace('<css input>:', '')
    }

    err.message = err.message.replace(/:\s/, '] ')

    console.error('\n', chalk.bold.red(`[${err.message}`))
    console.error('\n', err.showSourceCode(), '\n\n')

    if (argv.watch) return
  } else {
    console.error(err)
  }
  process.exit(1)
}
