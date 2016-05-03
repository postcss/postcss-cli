var globby = require("globby");
var resolve = require("resolve");
var argv = require("yargs")
  .usage('Usage: $0 [--use|-u] plugin [--config|-c config.json] [--output|-o output.css] [input.css]')
  .example('postcss --use autoprefixer -c options.json -o screen.css screen.css',
    'Use autoprefixer as a postcss plugin')
  .example('postcss --use autoprefixer --autoprefixer.browsers "> 5%" -o screen.css screen.css',
    'Pass plugin parameters in plugin.option notation')
  .example('postcss -u postcss-cachify -u autoprefixer -d build *.css',
    'Use multiple plugins and multiple input files')
  .config('c')
  .alias('c', 'config')
  .describe('c', 'JSON file with plugin configuration')
  .alias('u', 'use')
  .describe('u', 'postcss plugin name (can be used multiple times)')
  .option('local-plugins', {
    describe: 'lookup plugins in current node_modules directory'
  })
  .alias('i', 'input')
  .alias('o', 'output')
  .describe('o', 'Output file (stdout if not provided)')
  .alias('d', 'dir')
  .describe('d', 'Output directory')
  .alias('m', 'map')
  .describe('m', 'Source map')
  .boolean('r')
  .alias('r', 'replace')
  .describe('r', 'Replace input file(s) with generated output')
  .alias('s', 'syntax')
  .describe('s', 'Alternative input syntax parser')
  .alias('p', 'parser')
  .describe('p', 'Alternative CSS parser')
  .option('poll', {
    describe: 'Use polling to monitor for changes.',
    default: false,
  })
  .alias('t', 'stringifier')
  .describe('t', 'Alternative output stringifier')
  .alias('l', 'log')
  .describe('l', 'Log when file is written')
  .alias('w', 'watch')
  .describe('w', 'auto-recompile when detecting source changes')
  .requiresArg(['u', 'c', 'i', 'o', 'd', 's', 'p', 't'])
  .version(function() {
    return [
      'postcss version',
      require('./node_modules/postcss/package.json').version
    ].join(' ');
  })
  .alias('v', 'version')
  .help('h')
  .alias('h', 'help')
  .check(function(argv) {
    if (argv._.length && argv.input) {
      throw 'Both positional arguments and --input option used for `input file`: please only use one of them.';
    }
    if (argv.output && argv.dir && argv.replace) {
      throw '`output file`, `output directory` and `replace` provided: please use either --output, --dir or --replace option only.';
    }
    if (argv.output && argv.dir) {
      throw 'Both `output file` and `output directory` provided: please use either --output or --dir option.';
    }
    if (argv.output && argv.replace) {
      throw 'Both `output file` and `replace` provided: please use either --output or --replace option.';
    }
    if (argv.dir && argv.replace) {
      throw 'Both `output directory` and `replace` provided: please use either --dir or --replace option.';
    }
    return true;
  })
  .argv;

if (!Array.isArray(argv.use)) {
  argv.use = [argv.use];
}

// support for postcss-import
if (argv.use.indexOf("postcss-import") !== -1) {
  var importConfig = argv["postcss-import"] || {};
  argv["postcss-import"] = importConfig;
  // auto-configure watch update hook
  if(!importConfig.onImport) {
    importConfig.onImport = function(sources) {
      global.watchCSS(sources, this.from);
    };
  }
}

var inputFiles = argv._.length ? argv._ : argv.input;
inputFiles = globby.sync(inputFiles);
if (!inputFiles.length) {
  // use stdin if nothing else is specified
  inputFiles = [undefined];
}
if (inputFiles.length > 1 && !argv.dir && !argv.replace) {
  throw 'Please specify either --replace or --dir [output directory] for your files';
}

// load and configure plugin array
var plugins = argv.use.map(function(name) {
  var local = argv['local-plugins'];
  var plugin;
  if (local) {
    var resolved = resolve.sync(name, {basedir: process.cwd()});
    plugin = require(resolved);
  } else if (name) {
    plugin = require(name);
  } else {
    return null;
  }
  if (plugin.default && typeof plugin.default === 'function') {
    plugin = plugin.default;
  }
  if (name in argv) {
    plugin = plugin(argv[name]);
  } else {
    plugin = plugin.postcss || plugin();
  }
  return plugin;
});

var customSyntaxOptions = ['syntax', 'parser', 'stringifier']
  .reduce(function(cso, opt) {
    if (argv[opt]) {
      cso[opt] = require(argv[opt]);
    }
    return cso;
  }, Object.create(null));


var mapOptions = argv.map;
// treat `--map file` as `--no-map.inline`
if (mapOptions === 'file') {
  mapOptions = { inline: false };
}

var async = require('neo-async');
var fs = require('fs');
var path = require('path');
var readFile = require('read-file-stdin');
var path = require('path');
var postcss = require('postcss');
var processor = plugins[0] ? postcss(plugins) : postcss();
var mkdirp = require('mkdirp');

// hook for dynamically updating the list of watched files
global.watchCSS = function() {};
if (argv.watch) {
  global.watchCSS = fsWatcher(inputFiles);
}

async.forEach(inputFiles, compile, onError);

function fsWatcher(entryPoints) {
  var watchedFiles = entryPoints;
  var index = {}; // source files by entry point
  var opts = {};

  if (argv.poll) {
    opts.usePolling = true;
  }
  if (typeof argv.poll === 'number') {
    opts.interval = argv.poll;
  }

  var watcher = require('chokidar').watch(watchedFiles, opts);
  // recompile if any watched file is modified
  // TODO: only recompile relevant entry point
  watcher.on('change', function() {
    async.forEach(entryPoints, compile, function(err) {
      return onError.call(this, err, true);
    });
  });

  return function updateWatchedFiles(files, entryPoint) {
    // update source files for current entry point
    entryPoint = entryPoint || null;
    index[entryPoint] = files;
    // aggregate source files across entry points
    var entryPoints = Object.keys(index);
    var sources = entryPoints.reduce(function(files, entryPoint) {
      return files.concat(index[entryPoint]);
    }, []);
    // update watch list
    watcher.unwatch(watchedFiles);
    watcher.add(sources);
    watchedFiles = sources;
  };
}

function compile(input, fn) {
  var output = argv.output;
  if (argv.dir) {
    output = path.join(argv.dir, path.basename(input));
  } else if (argv.replace) {
    output = input;
  }

  processCSS(processor, input, output, fn);
}

function processCSS(processor, input, output, fn) {
  function doProcess(css, fn) {
    function onResult(result) {
      if (typeof result.warnings === 'function') {
        result.warnings().forEach(function(w) { console.warn(w.toString()); });
      }
      fn(null, result);
    }

    var options = {
      from: input,
      to: output
    };

    Object.keys(customSyntaxOptions).forEach(function(opt) {
      options[opt] = customSyntaxOptions[opt];
    });

    if (typeof mapOptions !== 'undefined') {
      options.map = mapOptions;
    }

    var result = processor.process(css, options);

    if (typeof result.then === 'function') {
      result.then(onResult).catch(fn);
    } else {
      process.nextTick(onResult.bind(null, result));
    }
  }

  async.waterfall([
    async.apply(readFile, input),
    doProcess,
    async.apply(writeResult, output)
  ], fn);
}

function onError(err, keepAlive) { // XXX: avoid overloaded signature?
  if (err) {
    if (err.message && typeof err.showSourceCode === 'function') {
      console.error(err.message, err.showSourceCode());
    } else {
      console.error(err);
    }
    if (!keepAlive) {
      process.exit(1);
    }
  }
}

function writeResult (name, content, fn) {
  var funcs = [
    async.apply(writeFile, name, content.css)
  ];
  if (content.map && name) {
    funcs.push(async.apply(writeFile, name + '.map', content.map.toString()));
  }
  async.parallel(funcs, fn);
}

function writeFile(name, content, fn) {
  if (!name) {
    process.stdout.write(content);
    return fn();
  }

  mkdirp(path.dirname(name), function (err) {
    if (err) {
      fn(err);
    } else {
      fs.writeFile(name, content, fn);

      if (argv.log) {
        console.log('Generated file: ' + name);
      }
    }
  });
}
