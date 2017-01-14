'use strict'

const fs = require('fs-promise')
const path = require('path')

const chalk = require('chalk')
const spinner = require('ora')()
const globber = require('globby')
const watcher = require('chokidar')

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
  return `${chalk.bold.red(logo)}
                         PostCSS: v${require('postcss/package.json').version}
                     Load Config: v${require('postcss-load-config/package.json').version}`
}

const argv = require('yargs')
  .usage(`${chalk.bold.red(logo)}\nUsage: \n\n$0 [--config|-c path/to/postcss.config.js] [input.css] [--output|-o output.css] [-watch|-w]`)
  .config('c')
  .alias('e', 'env').describe('e', 'Environment')
  .alias('c', 'config').describe('c', 'Config')
  .alias('o', 'output').describe('o', 'Output')
  .alias('d', 'dir').describe('d', 'Output Directory')
  .alias('r', 'replace').describe('r', 'Replace the input file')
  .alias('m', 'map').describe('m', 'Sourcemaps')
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

if (argv.env) process.env.NODE_ENV = argv.env

if (argv.replace) output = input

if (!output && !dir) throw new Error(`No Output specified, either --output, --dir, or --replace option must be passed`)

// Use warn to avoid writing to stdout
console.warn(chalk.bold.red(logo))

spinner.text = `Loading Config`
spinner.start()

Promise.all([ globber(input), config() ])
  .then((arr) => {
    // Until parameter destructuring is supported
    let files = arr[0]
    let config = arr[1]

    if (!files || !files.length) throw new Error('You must pass a list of files to parse')

    spinner.succeed()

    return Promise.all(files.map(file => processCSS(file, config)))
  })
  .then(() => {
    if (argv.watch) {
      spinner.text = 'Waiting for file changes...'

      watcher
      .watch(input)
      .on('ready', (file) => spinner.start())
      .on('change', (file) => {
        spinner.text = `Processing ${chalk.green(`${file}`)}`

        config()
          .then((config) => processCSS(file, config, watcher))
          .then(() => {
            spinner.text = 'Waiting for file changes...'
            spinner.start()
          })
          .catch(error)
      })
    }
  })
  .catch(error)

function processCSS (file, config, watcher) {
  spinner.text = `Processing ${file}`
  spinner.start()

  let options = Object.assign(
    {
      from: file,
      to: output || path.join(dir, path.basename(file))
    },
    config.options
  )

  options.to = path.resolve(options.to)

  return fs.readFile(file)
    .then(css => postcss(config.plugins).process(css, options))
    .then((result) => {
      if (watcher) {
        result.messages
         .filter((msg) => msg.type === 'dependency' ? msg : '')
         .forEach((dep) => watcher.add(dep))
      }

      if (result.messages.some(msg => msg.type === 'warning')) spinner.fail()

      return fs.outputFile(options.to, result.css)
        .then(() => {
          spinner.succeed()
          return result
        })
    })
}

function config () {
  if (argv.use || argv.parser || argv.stringifier || argv.syntax) {
    return {
      plugins: argv.use ? argv.use.map(plugin => require(plugin)) : [],
      options: {
        parser: argv.parser ? require(argv.parser) : undefined,
        syntax: argv.syntax ? require(argv.syntax) : undefined,
        stringifier: argv.stringifier ? require(argv.stringifier) : undefined,
        map: argv.map
      }
    }
  }

  return postcssrc()
    .catch((err) => {
      if (err.message.indexOf('No PostCSS Config found') === -1) throw err
      return { plugins: [], options: {} }
    })
}

function error (err) {
  try {
    spinner.fail()
  } catch (e) {
    // Don't worry about this
  }

  // PostCSS Error
  if (err.name === 'CssSyntaxError') {
    err.message = err.message
      .replace(`${err.file}:`, '[')
      .replace(/:\s/, '] ')

    console.log(chalk.bold.red('\n', err.message))
    console.log('\n', err.showSourceCode(), '\n')

    return
  }
  // PostCSS Config Error
  console.log(chalk.bold.red(err.message))

  process.exit(1)
}
