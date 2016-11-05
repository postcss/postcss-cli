var globby = require('globby')
var resolve = require('resolve')
var path = require('path')
var async = require('neo-async')
var fs = require('fs')
var postcss = require('postcss')
var mkdirp = require('mkdirp')
var onError = require('./on-error')
var processCSS = require('./process-css')
var fsWatcher = require('./fs-watcher')
var compile = require('./compile')

function CLI(argv) {
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
      try {
        plugin = require(name)
      } catch(e) {
        plugin = require(path.join('..', name))
      }
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

  var mapOptions = argv.map;
  // treat `--map file` as `--no-map.inline`
  if (mapOptions === 'file') {
    mapOptions = { inline: false };
  }

  var processor = plugins[0] ? postcss(plugins) : postcss();

  // hook for dynamically updating the list of watched files
  global.watchCSS = function() {};
  if (argv.watch) {
    global.watchCSS = fsWatcher(argv, inputFiles);
  }

  async.forEach(inputFiles, function (file, done) {
    compile(file, processor, argv, done)
  }, onError);
}

module.exports = CLI
