# postcss-cli

Traditional CLI for [postcss]

## Instalation

npm install postcss-cli

## Usage

    postcss [options] -o output-file input-file

#### `--output|-o`

Output file name - required

#### `--use|-u`

Plugin to be used. Multiple plugins can be specified. At least one is required.

#### `--config|-c`

JSON file with plugin configuration. Plugin names should be the keys.

````json
{
    "autoprefixer-core": {
        "browsers": "> 5%"
    },
    "postcss-cachify": {
        "baseUrl": "/res"
    }
}
````

Alternatively configuration options can be passed as `--plugin.option` parameters.

### `--safe`

Enable Safe Mode, in which PostCSS will try to fix CSS syntax errors.

#### `-h, --help`

Show help

### Examples

Use autoprefixer as a postcss plugin pass parameters from a json file

    postcss --use autoprefixer-core -c options.json -o screen.css screen.css

Use more than one plugin and pass config parameters

    postcss --use autoprefixer-core --autoprefixer-code.browsers "> 5%" \
        --use postcss-cachify --postcss-cachify.baseUrl /res \
        -o screen.css screen.css

## Licence

MIT

[postcss]: https://github.com/postcss/postcss
