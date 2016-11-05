#!/usr/bin/env node

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const program = require('commander');
const suffix = require('./lib/utils').suffix;

program
  .option('-e, --entry-point <entry>', 'entry point of the application', suffix('.js'), 'index')
  .option('-n, --no-server', 'run without starting entry-point')
  .option('-w, --watch', 'deprecated, for backward comp.')
  .option('-s, --silent', 'deprecated, for backward comp.')
  .option('-h, --hot', 'use hot module replacement')
  .parse(process.argv);

require('./lib/tasks/aggregators/start')(gulp, plugins, program);
