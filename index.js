var argv = require("yargs")
  .usage('Usage: $0 -use|-p plugin [--config|-c config.json] --output|-o output.css input.css')
  .example('postcss --use autoprefixer -c options.json -o screen.css screen.css',
    'Use autoprefixer as a postcss plugin')
  .example('postcss --use autoprefixer --autoprefixer.browsers "> 5%" -o screen.css screen.css',
    'Pass plugin parameters in plugin.option notation')
  .demand(1, 'Please specify input file.')
  .config('c')
  .alias('c', 'config')
  .describe('c', 'JSON file with plugin configuration')
  .alias('p', 'use')
  .describe('p', 'postcss plugin name (can be used multiple times)')
  .demand('p', 'Please specify at least one plugin name.')
  .alias('o', 'output')
  .describe('o', 'Output file')
  .demand('o', 'Please specify output file.')
  .requiresArg(['p', 'c', 'o'])
  .help('h')
  .alias('h', 'help')
  .wrap()
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
    plugin = plugin.postcss;
  }
  return plugin;
});


var fs = require('fs');

var input = argv._[0];
var output = argv.output;

var css = fs.readFileSync(input, 'utf8');

var postcss = require('postcss');
var processor = postcss(plugins);
var result = processor.process(css, {
  from: input,
  to: output
});


fs.writeFileSync(output, result.css);
