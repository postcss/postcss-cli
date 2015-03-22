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

var fs = require('fs');
var path = require('path');
var postcss = require('postcss');
var processor = postcss(plugins);

function process(processor, input, output) {
  var css = fs.readFileSync(input, 'utf8');
  var result = processor.process(css, {
    safe: argv.safe,
    from: input,
    to: output
  });
  fs.writeFileSync(output, result.css);
}

argv._.forEach(function(input) {
  var output = argv.output;
  if(!output) {
    output = path.join(argv.dir, path.basename(input));
  }
  process(processor, input, output);
});
