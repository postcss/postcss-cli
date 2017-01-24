'use strict'

const fs = require('fs-promise')
const path = require('path')

const chalk = require('chalk')
const ora = require('ora')
const spinner = ora()
const globber = require('globby')
const chokidar = require('chokidar')
const getStdin = require('get-stdin')

const postcss = require('postcss')
const postcssrc = require('postcss-load-config')

const getDependencyMessages = require('./lib/get-dependency-messages.js')

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
  .alias('c', 'config').describe('c', 'Config')
  .alias('o', 'output').describe('o', 'Output')
  .alias('d', 'dir').describe('d', 'Output Directory')
  .alias('r', 'replace').describe('r', 'Replace the input file')
  .alias('m', 'map').describe('m', 'Write sourcemap to external file')
  .describe('no-map', 'Disable sourcemaps')
  .alias('u', 'use').describe('u', 'List of plugins to apply').array('u')
  .alias('p', 'parser').describe('p', 'Parser')
  .alias('s', 'syntax').describe('s', 'Syntax')
  .alias('t', 'stringifier').describe('t', 'Stringifier')
  .alias('w', 'watch').describe('w', 'Watch files for changes')
  .help('h').alias('h', 'help')
  .version(version).alias('v', 'version')
  .requiresArg(['i', 'o'])
  .argv

let dir = argv.dir
let input = argv._
let output = argv.output

let config = {plugins: [], options: {}}

if (argv.env) process.env.NODE_ENV = argv.env

if (argv.config) argv.config = path.resolve(argv.config)
else argv.config = process.cwd()

if (!output && !dir && !argv.replace) {
  throw new Error(`No Output specified, either --output, --dir, or --replace option must be passed`)
}

// Use warn to avoid writing to stdout
console.warn(chalk.bold.red(logo))

spinner.text = 'Loading Config'
spinner.start()
getConfig({}, argv.config)
  .then(() => {
    spinner.succeed()

    if (input && input.length) return globber(input)
    // Else, read from stdin:
    if (!argv.output) throw new Error('Must specify --output when reading from stdin')
    if (argv.watch) throw new Error('Cannot run in watch mode when reading from stdin')
    console.warn('No files passed, reading from stdin')
    return ['-']
  })
  .then(expandedInput => {
    input = expandedInput
    if (!input || !input.length) throw new Error('You must pass a valid list of files to parse')
    if (input.length > 1 && argv.output) throw new Error('Must use --dir or --replace with multiple input files')

    return processFiles(input)
  })
  .then(function (results) {
    if (argv.watch) {
      spinner.text = 'Waiting for file changes...'

      let watcher = chokidar
      .watch(input.concat(getDependencyMessages(results)))

      watcher
      .add(config.file)
      .on('ready', (file) => spinner.start())
      .on('change', (file) => {
        // If this is not a direct input file, process all:
        if (input.indexOf(file) === -1) {
          return getConfig()
          .then(() => processFiles(input))
          .then(results => watcher.add(getDependencyMessages(results)))
          .catch(error)
        }

        getConfig()
        .then(() => processFiles(file))
        .then(result => {
          watcher.add(getDependencyMessages(result))
          spinner.text = 'Waiting for file changes...'
          spinner.start()
        })
        .catch(error)
      })
    }
  })
  .catch(error)

function processCSS (css, filename) {
  var spinner = ora(`Processing ${filename || 'your CSS'}`)
  spinner.start()

  let options = Object.assign(
    {
      from: filename,
      to: output || (argv.replace ? filename : path.join(dir, path.basename(filename)))
    },
    config.options
  )
  options.to = path.resolve(options.to)

  return postcss(config.plugins).process(css, options)
    .then(result => {
      if (result.messages.some(msg => msg.type === 'warning')) spinner.fail()

      var tasks = [fs.outputFile(options.to, result.css)]
      if (result.map) {
        tasks.push(fs.outputFile(options.to.replace('.css', '.css.map'), result.map))
      }
      return Promise.all(tasks)
        .then(() => {
          spinner.succeed()
          return result
        })
    })
}

function processFiles (files) {
  if (typeof files === 'string') files = [files]
  return Promise.all(files.map(file => {
    // Read from stdin
    if (file === '-') {
      return getStdin()
      .then(css => processCSS(css))
    }
    return fs.readFile(file)
    .then(css => processCSS(css, file))
  }))
}

function getConfig (ctx, path) {
  if (argv.use || argv.parser || argv.stringifier || argv.syntax) {
    config = {
      plugins: argv.use ? argv.use.map(plugin => require(plugin)) : [],
      options: {
        parser: argv.parser ? require(argv.parser) : undefined,
        syntax: argv.syntax ? require(argv.syntax) : undefined,
        stringifier: argv.stringifier ? require(argv.stringifier) : undefined
      }
    }
    setMap()
    return Promise.resolve()
  } else {
    return postcssrc(ctx, path)
    .then(conf => {
      config = conf
      setMap()
    })
    .catch(err => {
      if (err.message.indexOf('No PostCSS Config found') === -1) throw err
    })
  }
}

function setMap () {
  // Yargs interprets --no-map as argv.map: false:
  if (argv.map === false) config.options.map = false
  // If --map is passed:
  else if (argv.map) config.options.map = {inline: false}
  // If neither --map or --no-map is passed:
  else config.options.map = true
}

function error (err) {
  try {
    spinner.fail()
  } catch (e) {
    // Don't worry about this
  }
  // Syntax Error
  if (err.name === 'CssSyntaxError') {
    err.message = err.message.substr(err.file.length + 1).replace(/:\s/, '] ')

    console.error(chalk.bold.red('\n', `[${err.message}`))
    console.error('\n', err.showSourceCode(), '\n')

    process.exit(1)
  }
  // Error
  console.error(err)

  process.exit(1)
}
