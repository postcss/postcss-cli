2.5.2 / 2016-04-18
==================

  * Fix typo in help message: -use => [--use|-u]
  * npm install --save mkdirp
  * Support mkdirp to create dest path if it doesn't exists
  * Fix booleans in config file

2.5.1 / 2016-02-11
==================

 * fix `input` argument

2.5.0 / 2016-01-30
==================

 * move to postcss/postcss-cli repository
 * Update Readme.md

2.4.1 / 2016-01-27
==================

 * improve warning disply format

2.4.0 / 2016-01-15
==================

 * add support for source maps

2.3.3 / 2015-12-28
==================

 * add usage example for `local-plugins` option in config file

2.3.2 / 2015-10-27
==================

 * auto-configure postcss-import support
 * add support for watching multiple entry points

2.3.1 / 2015-10-25
==================

 * update Travis config
 * upgrade postcss-import dependency - fix deprecation warnings during make test-watch

2.3.0 / 2015-10-24
==================

 * add --local-plugins option that lets postcss-cli to look for plugins in current directory

2.2.0 / 2015-10-09
==================

 * add support for --replace|-r - if used input files are replaced with generated output
 * refactor support for custom syntax options

2.1.1 / 2015-10-08
==================

 * add globby to support wildcards in Windows
 * remove obsolete note on postcss-import compatibility

2.1.0 / 2015-09-01
==================

 * add support for PostCSS 5.0 custom syntax options

2.0.0 / 2015-08-24
==================

 * remove support for --safe option
 * switch to using postcss 5.x

1.5.0 / 2015-07-20
==================

 * add watch mode (-w|--watch) in which postcss-cli observes and recompiles inputs whenever they change
 * update neo-async dependency to released version
 * update postcss-url dependency (used in tests only)

1.4.0 / 2015-07-12
==================

 * allow specifying input file via config file
 * allow specifying -u|--use via config file

1.3.1 / 2015-05-03
==================

 * update npm keyword: postcssrunner -> postcss-runner

1.3.0 / 2015-04-28
==================

 * add support for stdin/stdout if no input/output file specified

1.2.1 / 2015-04-20
==================

 * fix typo in readme

1.2.0 / 2015-04-02
==================

 * display warnings and errors
 * stop testing on node 0.10

1.1.0 / 2015-03-28
==================

 * prefer postcss async API if available

1.0.0 / 2015-03-22
==================

 * use official yargs version
 * add support for multiple input files

0.3.0 / 2015-03-19
==================

 * support JS format as plugins config

0.2.0 / 2015-03-13
==================

 * use autoprefixer instead of autoprefixer-core
 * change short options for --use from `p` to `u`
 * add -v|--version support
 * add --safe option to enable postcss safe mode

0.1.0 / 2015-03-11
==================

 * initial implementaion
