#!/usr/bin/env node

const program = require('commander');
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

program
	.option('-c, --client', 'special linters for client only: stylelint')
	.parse(process.argv);

require('./lib/tasks/aggregators/lint')(gulp, plugins, program);
gulp.start('lint');
