#!/usr/bin/env node

const program = require('commander');
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

program
	.option('-m, --mocha', 'run unit tests on mocha')
	.option('-d, --dirs <globs>', 'globs of source files, including tests, comma separated', val => val.split(','))
	.parse(process.argv);

program.watch = true;

require('./lib/tasks/aggregators/dev')(gulp, plugins, program);

gulp.start('dev');
