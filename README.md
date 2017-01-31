[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![tests][tests]][tests-url]
[![code style][style]][style-url]
[![chat][chat]][chat-url]

<div align="center">
  <img width="100" height="100" title="CLI" src="http://postcss.github.io/postcss-cli/logo.svg">
  <a href="https://github.com/postcss/postcss">
    <img width="110" height="110" title="PostCSS" src="http://postcss.github.io/postcss/logo.svg" hspace="10">
  </a>
  <h1>PostCSS CLI</h1>
</div>

## Install

```bash
npm i -D postcss-cli
```

## Usage

```bash
postcss [options] [input] [-o output|-d output-dir|-r] [--watch]
```

## Options

|Name|Default|Description|
|:--:|:-----:|:----------|
|**`--dir/-d`**|`undefined`|Directory destination|
|**`--ext/-ex`**|`undefined`|Change Output File Extension|
|**`--output/-o`**|`process.stdout`|File destination|
|**`--replace/-r`**|`undefined`|Replace file(s) with output|
|**`--parser/-p`**|`undefined`|[Custom Parser][parser] (e.g SugarSS)|
|**`--syntax/-s`**|`undefined`|[Custom Syntax][syntax] (e.g Midas)|
|**`--stringifier/-t`**|`undefined`|[Custom Stringifier][stringifier] (e.g ..)|
|**`--map/-m`**|`{ inline: false }`|Enable external Sourcemaps|
|**`--no-map`**|`false`|Disable Sourcemaps|
|**`--watch/-w`**|`false`|Watch files && `postcss.config.js`for changes|
|**`--help/-h`**|`undefined`|CLI Usage|
|**`--version/-v`**|`undefined`|CLI Version|

[parser]: https://github.com/postcss/postcss#custom-syntaxes

#### `--map|-m`

Activate sourcemaps generation. By default inline sourcemaps are generated.
You can use [advances source map options][sourcemaps].

#### [`--config|-c`](https://github.com/michael-ciniawsky/postcss-load-config)

```bash
postcss -c|--config path/to/postcss.config.js
```
**postcss.config.js**

```js
module.exports = (ctx) => ({
  parser: ctx.options.parser ? 'sugarss' : false,
  map: ctx.env === 'development' ? 'inline' : false,
  plugins: {
    'postcss-import': { root: ctx.file.dirname },
    'postcss-nested': {},
    'cssnano': ctx.env !== 'development' ? {} : false
  }
})
```


[npm]: https://img.shields.io/npm/v/postcss-cli.svg
[npm-url]: https://npmjs.com/package/postcss-cli

[node]: https://img.shields.io/node/v/<name>-loader.svg
[node-url]: https://nodejs.org

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
