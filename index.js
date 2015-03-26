var argv = require("yargs")
  .usage('Usage: $0 -use|-p plugin [--config|-c config.json] --output|-o output.css input.css')
  .example('postcss --use autoprefixer -c options.json -o screen.css screen.css',
    'Use autoprefixer as a postcss plugin')
  .example('postcss --use autoprefixer --autoprefixer.browsers "> 5%" -o screen.css screen.css',
    'Pass plugin parameters in plugin.option notation')
  .example('postcss -u postcss-cachify -u autoprefixer -d build *.css',
    'Use multiple plugins and multiple input files')
  .demand(1, 'Please specify at least one input file.')
  .config('c')
  .alias('c', 'config')
  .describe('c', 'JSON file with plugin configuration')
  .alias('u', 'use')
  .describe('u', 'postcss plugin name (can be used multiple times)')
  .demand('u', 'Please specify at least one plugin name.')
  .alias('o', 'output')
  .describe('o', 'Output file')
  .alias('d', 'dir')
  .describe('d', 'Output directory')
  .requiresArg(['u', 'c', 'o', 'd'])
  .boolean('safe')
  .describe('safe', 'Enable postcss safe mode.')
  .version(function() {
    return [
      'postcss version',
      require('./node_modules/postcss/package.json').version
    ].join(' ');
  }, 'v')
  .alias('v', 'version')
  .help('h')
  .alias('h', 'help')
  .wrap()
  .check(function(argv) {
    if (argv._.length > 1 && !argv.dir) {
      throw 'Please specify --dir [output directory] for your files';
    }
    if (argv.output && argv.dir) {
      throw 'Both `output file` and `output directory` provided: please use either --output or --dir option.';
    }
    if (!argv.output && !argv.dir) {
      throw 'Please specify --output [output file name] or --dir [out files location]';
    }
    return true;
  })
  .argv;

if (!Array.isArray(argv.use)) {
  argv.use = [argv.use];
}

// load and configure plugin array
var plugins = argv.use.map(function(name) {
  var plugin = require(name);
  if (name in argv) {
    plugin = plugin(argv[name]);
  } else {
    plugin = plugin.postcss || plugin();
  }
  return plugin;
});

var async = require('neo-async');
var fs = require('fs');
var path = require('path');
var postcss = require('postcss');
var processor = postcss(plugins);

function processCSS(processor, input, output, fn) {
  function doProcess(css, fn) {
    function onResult(result) {
      if (typeof result.warnings === 'function') {
        result.warnings().forEach(console.error);
      }
      fn(null, result);
    }

    var result = processor.process(css, {
      safe: argv.safe,
      from: input,
      to: output
    });
    if (typeof result.then === 'function') {
      result.then(onResult).catch(fn);
    } else{
      process.nextTick(onResult.bind(null, result));
    }
  }

  async.waterfall([
    async.apply(fs.readFile, input, 'utf8'),
    doProcess,
    async.apply(fs.writeFile, output)
  ], fn);
}

async.forEach(argv._, function(input, fn) {
  var output = argv.output;
  if(!output) {
    output = path.join(argv.dir, path.basename(input));
  }
  processCSS(processor, input, output, fn);
}, function(err) {
  if (err) {
    if (err.message && typeof err.showSourceCode === 'function') {
      console.error(err.message, err.showSourceCode());
    } else {
      console.error(err);
    }
    process.exit(1);
  }
});
