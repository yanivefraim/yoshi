#!/usr/bin/env node

const {watchMode} = require('./lib/utils');
if (watchMode()) {
  process.exit(0);
}

const program = require('commander');
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

program
	.option('--client', 'special linters for client only: stylelint')
	.parse(process.argv);

require('./lib/tasks/aggregators/lint')(gulp, plugins, program);
gulp.start('lint');
