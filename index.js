'use strict'
const fs = require('fs-promise')
const path = require('path')

const chalk = require('chalk')
const spinner = require('ora')()
const globber = require('globby')
const watcher = require('chokidar')

const postcss = require('postcss')
const postcssLoadConfig = require('postcss-load-config')

const postcssrc = () => {
  return postcssLoadConfig()
  .catch(e => {
    // Ignore PostCSS config not found error:
    if (e.message.indexOf('No PostCSS Config found') === -1) throw e
    else return {plugins: [], options: {}}
  })
}

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
  return `${chalk.bold.red(logo)}
                         PostCSS: v${require('postcss/package.json').version}
                     Load Config: v${require('postcss-load-config/package.json').version}`
}

const argv = require('yargs')
  .usage(`${chalk.bold.red(logo)}\nUsage: \n\n$0 [--config|-c path/to/postcss.config.js] [input.css] [--output|-o output.css] [-watch|-w]`)
  .config('c')
  .alias('e', 'env').describe('e', 'Environment')
  .alias('c', 'config').describe('c', 'Config')
  .alias('i', 'input').describe('i', 'Input')
  .alias('o', 'output').describe('o', 'Output')
  .alias('d', 'dir').describe('d', 'Output Directory')
  .alias('r', 'replace').describe('r', 'Replace the input file')
  .alias('m', 'map').describe('m', 'Sourcemaps')
  .alias('p', 'parser').describe('p', 'Parser')
  .alias('s', 'syntax').describe('s', 'Syntax')
  .alias('t', 'stringifier').describe('t', 'Stringifier')
  .alias('w', 'watch').describe('w', 'Watch files for changes')
  .help('h').alias('h', 'help')
  .version(version).alias('v', 'version')
  .requiresArg(['i', 'o'])
  .argv

let dir = argv.dir
let input = argv._ || argv.input
let output = argv.output

const defaultOptions = {
  parser: argv.parser ? require(argv.parser) : undefined,
  syntax: argv.syntax ? require(argv.syntax) : undefined,
  stringifier: argv.stringifier ? require(argv.stringifier) : undefined,
  map: argv.map
}

if (argv.env) process.env.NODE_ENV = argv.env

if (argv.replace) output = input

if (!output && !dir) throw new Error('Must pass --output, --dir, or --replace option')

console.warn(chalk.bold.red(logo)) // Use warn to avoid writing to stdout

spinner.text = `Loading Config`
spinner.start()
Promise.all([globber(input), postcssrc()]).then((arr) => {
  // Until parameter destructuring is supported:
  let files = arr[0]
  let config = arr[1]

  if (!files || !files.length) throw new Error('You must pass a list of files to parse')

  spinner.succeed()

  return Promise.all(files.map(file => processFile(file, config)))
})
.then(function () {
  if (argv.watch) {
    spinner.text = 'Waiting for file changes...'

    watcher
    .watch(input)
    .on('ready', (file) => spinner.start())
    .on('change', (file) => {
      spinner.text = `Processing ${chalk.green(`${file}`)}`

      postcssrc().then((config) => {
        return processFile(file, config, watcher)
      })
      .then(() => {
        spinner.text = 'Waiting for file changes...'
        spinner.start()
      })
      .catch(errorHandler)
    })
  }
})
.catch(errorHandler)

function processFile (file, config, watcher) {
  spinner.text = `Processing ${file}`
  spinner.start()

  let options = Object.assign(
    {},
    defaultOptions,
    config.options,
    {
      from: file,
      to: output || path.join(dir, path.basename(file))
    }
  )

  options.to = path.resolve(options.to)

  return fs.readFile(file)
  .then(css => postcss(config.plugins).process(css, options))
  .then((result) => {
    if (path.extname(options.to) !== '.css') {
      options.to = options.to.replace(/.\w+$/, '.css')
    }

    if (watcher) {
      result.messages
      .filter((msg) => msg.type === 'dependency' ? msg : '')
      .forEach((dep) => watcher.add(dep))
    }

    if (result.messages.some(i => i.type === 'warning')) spinner.fail()

    return fs.outputFile(options.to, result.css)
    .then(() => {
      spinner.succeed()
      return result
    })
  })
}

function errorHandler (err) {
  try {
    spinner.fail()
  } catch (e) {
    // Don't worry about this
  }
  console.error(err)
  process.exit(1)
}
