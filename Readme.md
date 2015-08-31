[![Build Status](https://img.shields.io/travis/code42day/postcss-cli.svg)](http://travis-ci.org/code42day/postcss-cli)
[![Dependency Status](https://img.shields.io/gemnasium/code42day/postcss-cli.svg)](https://gemnasium.com/code42day/postcss-cli)
[![NPM version](https://img.shields.io/npm/v/postcss-cli.svg)](http://badge.fury.io/js/postcss-cli)

# postcss-cli

Traditional CLI for [postcss]

## Installation

npm install postcss-cli

| postcss-cli version | postcss version |
| ---- | ---- |
| 1.x | 4.x |
| 2.x | 5.x |

## Usage

    postcss [options] [-o output-file|-d output-directory] [input-file]

#### `--output|-o`

Output file name. If no output file is specified, `postcss` will write to `stdout`, however plugins
that rely on output file location will not work properly.

Similarly, if no input file is specified, `postcss` will read from `stdin`.
Plugins that rely on input file location will not work properly.

#### `--dir|-d`

Output files location. Either `--output` or `--dir` option, but not both of them, need to be specified.
`--dir` needs to be used if multiple input file is provided.

#### `--use|-u`

Plugin to be used. Multiple plugins can be specified. At least one is required unless specified
within config file.

#### `--watch|-w`

Observe file system changes and recompile as source files change.

When inlining CSS imports (e.g. with [postcss-import]), add an update handler
to your JavaScript configuration file to ensure referenced modules are taken
into account:

```js
{
  "postcss-import": {
    onImport: function(sources) {
      global.watchCSS(sources);
    }
  }
}
```

[postcss-import] does not have 5.x compatible version as of now. See workaround [here](https://github.com/code42day/postcss-cli/issues/24).

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
    "autoprefixer": {
        "browsers": "> 5%"
    },
    "postcss-cachify": {
        "baseUrl": "/res"
    }
}
````

#### `-s, --syntax`

Optional module to use as a [custom PostCSS syntax](https://github.com/postcss/postcss#custom-syntaxes).

#### `-p, --parser`

Optional module to use as a [custom PostCSS input parser](https://github.com/postcss/postcss#custom-syntaxes).

#### `-t, --stringifier`

Optional module to use as a [custom PostCSS output stringifier](https://github.com/postcss/postcss#custom-syntaxes).

#### `-h, --help`

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

## Licence

MIT

[postcss]: https://github.com/postcss/postcss
[postcss-import]: https://github.com/postcss/postcss-import