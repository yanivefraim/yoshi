#!/usr/bin/env node

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const program = require('commander');
const suffix = require('./lib/utils').suffix;
const start = require('./lib/tasks/aggregators/start');

program
  .option('-e, --entry-point <entry>', 'entry point of the application', suffix('.js'), 'index')
  .option('-n, --no-server', 'run without starting entry-point')
  .option('-w, --watch', 'deprecated, for backward comp.')
  .option('-s, --silent', 'deprecated, for backward comp.')
  .option('-h, --hot', 'use hot module replacement')
  .parse(process.argv);

const loadTasks = options => {
  require('./lib/tasks/node')(gulp, plugins, options);
  require('./lib/tasks/babel')(gulp, plugins, options);
  require('./lib/tasks/typescript')(gulp, plugins, options);
  require('./lib/tasks/sass')(gulp, plugins, options);
  require('./lib/tasks/mocha')(gulp, plugins, options);
  require('./lib/tasks/copy-assets')(gulp, plugins, options);
  require('./lib/tasks/clean')(gulp, plugins, options);
};

start(program, loadTasks);
