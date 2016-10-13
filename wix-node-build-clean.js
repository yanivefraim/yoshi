#!/usr/bin/env node

const program = require('commander');
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();

program
  .parse(process.argv);

require('./lib/tasks/aggregators/clean')(gulp, plugins, program);
gulp.start('clean');
