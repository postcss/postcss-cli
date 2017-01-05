'use strict'
const fs = require('fs')
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

let options = {
  parser: argv.parser || false,
  syntax: argv.syntax || false,
  strigifier: argv.strigifier || false,
  map: argv.map || false
}

if (argv.env) {
  process.env.NODE_ENV = argv.env
}

if (argv.replace) {
  output = input
}

if (!output && !dir) {
  throw new Error('Must pass --output, --dir, or --replace option')
}

console.log(chalk.bold.red(logo))

spinner.text = `Loading Files`
spinner.start()
globber(input).then((files) => {
  if (files && files.length) spinner.succeed()
  else throw new Error('You must pass a list of files to parse')

  spinner.text = `Loading Config`
  spinner.start()
  return postcssrc().then((config) => {
    files.forEach((file) => {
      fs.readFile(file, (err, css) => {
        if (err) throw err

        config !== undefined ? spinner.succeed() : spinner.fail()

        spinner.text = `Processing ${file}`
        spinner.start()

        options = Object.assign(
          options,
          { from: file, to: output || path.join(dir, path.basename(file)) }
        )

        postcss(config.plugins)
         .process(css, Object.assign(options, config.options))
         .then((result) => {
           if (path.extname(options.to) !== '.css') {
             options.to = options.to.replace(/.\w+$/, '.css')
           }

           fs.stat(path.dirname(options.to), (err) => {
             if (err) {
               fs.mkdir(path.dirname(options.to), (err) => {
                 if (err) throw err

                 fs.writeFile(options.to, result.css, (err) => {
                   if (err) throw err
                 })
               })
             } else {
               fs.writeFile(options.to, result.css, (err) => {
                 if (err) throw err
               })
             }
           })

           result.messages ? spinner.succeed() : spinner.fail()
         })
         .catch(errorHandler)
      })
    })
  })
})
.catch(errorHandler)

if (argv.watch) {
  spinner.text = 'Waiting for file changes...'

  watcher
  .watch(input)
  .on('ready', (file) => spinner.start())
  .on('change', (file) => {
    spinner.text = `Processing ${chalk.green(`${file}`)}`

    postcssrc().then((config) => {
      postcss(config.plugins)
       .process(fs.readFileSync(file), config.options)
       .then((result) => {
         result.messages
          .filter((msg) => msg.type === 'dependency' ? msg : '')
          .forEach((dep) => watcher.add(dep))

         fs.writeFile(options.to, result.css, (err) => {
           if (err) throw err
         })

         result.messages.length === 0 ? spinner.succeed() : spinner.fail()
       })
    })
    .catch(errorHandler)

    setTimeout(() => {
      spinner.text = 'Waiting for file changes...'
      spinner.start()
    }, 10000)
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
