#!/usr/bin/env node

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
require('./lib/tasks/aggregators/release')(gulp, plugins);

gulp.start('release');
