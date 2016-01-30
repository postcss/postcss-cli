[![Build Status](https://img.shields.io/travis/postcss/postcss-cli.svg)](http://travis-ci.org/postcss/postcss-cli)
[![Dependency Status](https://img.shields.io/gemnasium/postcss/postcss-cli.svg)](https://gemnasium.com/postcss/postcss-cli)
[![NPM version](https://img.shields.io/npm/v/postcss-cli.svg)](http://badge.fury.io/js/postcss-cli)

# postcss-cli

Traditional CLI for [postcss]

## Installation

`npm install postcss-cli`

| postcss-cli version | postcss version |
| ---- | ---- |
| 1.x | 4.x |
| 2.x | 5.x |

## Usage

    postcss [options] [-o output-file|-d output-directory|-r] [input-file]

#### `--output|-o`

Output file name. If no output file is specified, `postcss` will write to `stdout`, however plugins
that rely on output file location will not work properly.

Similarly, if no input file is specified, `postcss` will read from `stdin`.
Plugins that rely on input file location will not work properly.

#### `--dir|-d`

Output files location. Either `--output`, `--dir` or `--replace` option, but
not all of them, need to be specified. `--dir` or `--replace` needs to be used
if multiple input file is provided.

#### `--replace|-r`

Replace input file(s) with generated output. Either `--output`, `--dir` or
`--replace` option, but not all of them, need to be specified. `--replace` or
`--dir` needs to be used if multiple input file is provided.

#### `--use|-u`

Plugin to be used. Multiple plugins can be specified. At least one plugin needs to be specified either with `--use` option or in the config file.

#### `--map|-m`

Activate source map generation. By default inline maps are generated. To generate source maps
in a separate _.map_ file use `--map file` or `--no-map.inline`.

You can use [advances source map options][source-map-options] - some examples:

- `--no-map` - do not generated source maps - even if previous maps exist
- `--map.annotation <path>` - specify alternaive path to be used in source map annotation appended to CSS
- `--no-map.annotation` - supress adding annotation to CSS
- `--no-map.sourcesContent` - remove origin CSS from maps

#### `--local-plugins`

Look up plugins starting from `node_modules` located in the current working
directory. Without this option, postcss-cli will look for the plugins in the
`node_modules` in which it is installed - specifically if it is installed
globally it will only look for plugins that are globally installed.

#### `--watch|-w`

Observe file system changes and recompile as source files change.

When inlining CSS imports, add an update handler to your JavaScript
configuration file to ensure referenced modules are taken into account:

```js
{
  "postcss-import": {
    onImport: function(sources) {
      global.watchCSS(sources, this.from);
    }
  }
}
```

For [postcss-import], this handler is added automatically.

#### `--config|-c`

JSON file with plugin configuration. Plugin names should be the keys.

````json
{
    "autoprefixer": {
        "browsers": "> 5%"
    },
    "postcss-cachify": {
        "baseUrl": "/res"
    }
}
````

JavaScript configuration can be used if functions are allowed as plugins parameters:

````js
module.exports = {
  "postcss-url": {
    url: function(url) { return "http://example.com/" + url; }
  },
  autoprefixer: {
    browsers: "> 5%"
  }
};
````
Alternatively configuration options can be passed as `--plugin.option` parameters.

Note that command-line options can also be specified in the config file:

````json
{
    "use": ["autoprefixer", "postcss-cachify"],
    "input": "screen.css",
    "output": "bundle.css",
    "local-plugins": true,
    "autoprefixer": {
        "browsers": "> 5%"
    },
    "postcss-cachify": {
        "baseUrl": "/res"
    }
}
````

#### `--syntax|-s`

Optional module to use as a [custom PostCSS syntax](https://github.com/postcss/postcss#custom-syntaxes).

#### `--parser|-p`

Optional module to use as a [custom PostCSS input parser](https://github.com/postcss/postcss#custom-syntaxes).

#### `--stringifier|-t`

Optional module to use as a [custom PostCSS output stringifier](https://github.com/postcss/postcss#custom-syntaxes).

#### `--help|-h`

Show help

### Examples

Use autoprefixer as a postcss plugin pass parameters from a json file

    postcss --use autoprefixer -c options.json -o screen.css screen.css

Use more than one plugin and pass config parameters

    postcss --use autoprefixer --autoprefixer.browsers "> 5%" \
        --use postcss-cachify --postcss-cachify.baseUrl /res \
        -o screen.css screen.css

Use multiple plugins and multiple input files

    postcss -u postcss-cachify -u autoprefixer -d build *.css

## License

MIT

[postcss]: https://github.com/postcss/postcss
[postcss-import]: https://github.com/postcss/postcss-import
[source-map-options]: https://github.com/postcss/postcss/blob/master/docs/source-maps.md
