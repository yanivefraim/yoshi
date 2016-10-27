#!/usr/bin/env node

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const program = require('commander');
const runWebpack = require('./lib/tasks/webpack').run;

program
  .option('--dirs <dir,...>', 'directories to build from (comma-separated list)')
  .option('--output <dir>', 'output directory for the static assets', 'statics')
  .option('--context <dir>', 'The directory used for resolving entries', 'src')
  .option('--bundle [dir]', 'Deprecated, please avoid')
  .parse(process.argv);

require('./lib/tasks/aggregators/build')(gulp, plugins, program);

gulp.start('build');

Promise.all([
  runWebpack({debug: true}),
  runWebpack({debug: false})
]).catch(err => {
  console.error(err);
  process.exit(1);
});
