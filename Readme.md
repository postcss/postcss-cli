[![Build Status](https://img.shields.io/travis/code42day/postcss-cli.svg)](http://travis-ci.org/code42day/postcss-cli)
[![Dependency Status](https://img.shields.io/gemnasium/code42day/postcss-cli.svg)](https://gemnasium.com/code42day/postcss-cli)
[![NPM version](https://img.shields.io/npm/v/postcss-cli.svg)](http://badge.fury.io/js/postcss-cli)

# postcss-cli

Traditional CLI for [postcss]

## Installation

npm install postcss-cli

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

Plugin to be used. Multiple plugins can be specified. At least one is required.

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

JS configuration can be used if functions are allowed as plugins parameters:

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

### `--safe`

Enable Safe Mode, in which PostCSS will try to fix CSS syntax errors.

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
