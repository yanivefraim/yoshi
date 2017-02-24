#!/usr/bin/env node

const {watchMode} = require('./lib/utils');

if (watchMode()) {
  process.exit(0);
}

const program = require('commander');
const run = require('./lib/run');
const build = require('./lib/tasks/aggregators/build');

program
  .option('--output <dir>', 'output directory for the static assets', 'statics')
  .option('--context <dir>', 'The directory used for resolving entries', 'src')
  .option('--bundle [dir]', 'Deprecated, please avoid')
  .parse(process.argv);

run(program)(build);
