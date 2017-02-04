[![tests][tests]][tests-url]
[![cover][cover]][cover-url]
[![deps][deps]][deps-url]
[![npm][npm]][npm-url]
[![code style][style]][style-url]
[![chat][chat]][chat-url]

<div align="center">
  <img width="100" height="100" title="CLI" src="http://postcss.github.io/postcss-cli/logo.svg">
  <a href="https://github.com/postcss/postcss">
    <img width="110" height="110" title="PostCSS" src="http://postcss.github.io/postcss/logo.svg" hspace="10">
  </a>
  <h1>PostCSS CLI</h1>
</div>

## Installation

```bash
npm i -D postcss-cli
```

## Usage

```
postcss [input.css] [OPTIONS] [--output|-o output.css] [--watch]

Options:
  -o, --output       Output file                                        [string]
  -d, --dir          Output directory                                   [string]
  -r, --replace      Replace (overwrite) the input file                [boolean]
  -u, --use          List of postcss plugins to use                      [array]
  -p, --parser       Custom postcss parser                              [string]
  -t, --stringifier  Custom postcss stringifier                         [string]
  -s, --syntax       Custom postcss syntax                              [string]
  -w, --watch        Watch files for changes and recompile as needed   [boolean]
  -x, --extension    Override the output file extension                 [string]
  -e, --env          A shortcut for setting NODE_ENV                    [string]
  -c, --config       Set a custom path to look for a config file        [string]
  -m, --map          Create an external sourcemap
  --no-map           Disable the default inline sourcemaps
  -h, --help         Show help                                         [boolean]
  -v, --version      Show version number                               [boolean]

Examples:
  postcss input.css -o output.css       Basic usage
  cat input.css | postcss -u            Piping input & output
  autoprefixer > output.css

If no input files are passed, it reads from stdin. If neither -o, --dir, or
--replace is passed, it writes to stdout.

If there are multiple input files, the --dir or --replace option must be passed.
```

For more details on custom parsers, stringifiers and syntaxes, see the [postcss docs](https://github.com/postcss/postcss#syntaxes).

## Configuration

If you need to pass options to your plugins, or have a long plugin chain, you'll want to use a configuration file.

Example `postcss.config.js`:

```js
module.exports = () => {
  parser: 'sugarss',
  plugins: [
    require('postcss-import')({ /* Options */ }),
    require('postcss-url')({
      url: 'copy',
      useHash: true
    })
  ]
}
```

Configuration files are handled by [postcss-load-config](https://github.com/michael-ciniawsky/postcss-load-config). Refer to the docs there for more details.


[npm]: https://img.shields.io/npm/v/postcss-cli.svg
[npm-url]: https://npmjs.com/package/postcss-cli

[deps]: https://img.shields.io/gemnasium/postcss/postcss-cli.svg
[deps-url]: https://gemnasium.com/postcss/postcss-cli

[tests]: http://img.shields.io/travis/postcss/postcss-cli.svg
[tests-url]: https://travis-ci.org/postcss/postcss-cli

[style]: https://img.shields.io/badge/code%20style-standard-yellow.svg
[style-url]: http://standardjs.com/

[cover]: https://coveralls.io/repos/github/postcss/postcss-cli/badge.svg
[cover-url]: https://coveralls.io/github/postcss/postcss-cli

[chat]: https://img.shields.io/gitter/room/postcss/postcss.svg
[chat-url]: https://gitter.im/postcss/postcss
