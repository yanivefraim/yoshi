#!/usr/bin/env node

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const program = require('commander');
const {suffix, watchMode} = require('./lib/utils');
const {startWebpack} = require('./lib/tasks/webpack');
const runServer = require('./lib/tasks/run-server');

program
  .option('-e, --entry-point <entry>', 'entry point of the application', suffix('.js'), 'index.js')
  .option('-n, --no-server', 'run without starting entry-point')
  .option('-w, --watch', 'deprecated, for backward comp.')
  .option('-s, --silent', 'deprecated, for backward comp.')
  .option('-h, --hot', 'use hot module replacement')
  .parse(process.argv);

const options = Object.assign(program, {
  done: () => program.server && runServer({entryPoint: program.entryPoint})
});

watchMode(true);
require('./lib/tasks/aggregators/build')(gulp, plugins, options);
gulp.start('start');

startWebpack({
  hot: program.hot,
  debug: true
});
