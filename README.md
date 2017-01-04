[![npm][npm]][npm-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![code style][style]][style-url]
[![chat][chat]][chat-url]

<div align="center">
  <img width="100" height="100" title="CLI" src="logo.svg">
  <a href="https://github.com/postcss/postcss">
    <img width="110" height="110" title="PostCSS" src="http://postcss.github.io/postcss/logo.svg" hspace="10">
  </a>
</div>

# PostCSS CLI
Use PostCSS from the Terminal


## Installation

```bash
npm i -D postcss-cli
```

## Usage

```bash
postcss [options] [input] [-o output|-d output-dir|-r] [--watch]
```

## Options

#### `--input|-i`

Input file

#### `--output|-o`

Output file

**Note:** You must use `--dir` or `--replace` when multiple input files are provided.

#### `--dir|-d`

Output directory

#### `--replace|-r`

Replace the input files with the output.

#### `--parser|-p`

Optional module to use as a [custom PostCSS parser](https://github.com/postcss/postcss#custom-syntaxes).

#### `--syntax|-s`

Optional module to use as a [custom PostCSS syntax](https://github.com/postcss/postcss#custom-syntaxes).

#### `--stringifier|-t`

Optional module to use as a [custom PostCSS stringifier](https://github.com/postcss/postcss#custom-syntaxes).

#### `--map|-m`

Activate source map generation. By default inline maps are generated.
You can use [advances source map options][sourcemaps].

#### `--help|-h`

Display help

#### `--version|-v`

Display version

#### `--config|-c`

Specifies which config to load via [`postcss-load-config`](https://github.com/michael-ciniawsky/postcss-load-config)

**postcss.config.js**

```js
module.exports = (ctx) => {
  return {
    parser: ctx.sugar ? 'sugarss' : false,
    map: ctx.env === 'development' ? 'inline' : false,
    plugins: {
      'postcss-import': {},
      'postcss-nested': {},
      'cssnano': ctx.env !== 'development' ? {} : false
    }
  }
}
```

#### `--watch|-w`

Observe file system changes and recompile when source files changes.

## License

MIT


[npm]: https://img.shields.io/npm/v/postcss-cli.svg
[npm-url]: https://npmjs.com/package/postcss-cli

[deps]: https://img.shields.io/gemnasium/postcss/postcss-cli.svg
[deps-url]: https://gemnasium.com/postcss/postcss-cli

[tests]: http://img.shields.io/travis/postcss/postcss-cli.svg
[tests-url]: https://travis-ci.org/postcss/postcss-cli

[style]: https://img.shields.io/badge/code%20style-standard-yellow.svg
[style-url]: http://standardjs.com/

[chat]: https://img.shields.io/gitter/room/postcss/postcss.svg?maxAge=2592000
[chat-url]: https://gitter.im/postcss/postcss
