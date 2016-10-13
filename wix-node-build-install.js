#!/usr/bin/env node

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
require('./lib/tasks/aggregators/install')(gulp, plugins);

gulp.start('install');
