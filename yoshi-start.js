#!/usr/bin/env node

const program = require('commander');
const {suffix, watchMode} = require('./lib/utils');

watchMode(true);

const run = require('./lib/run');
const start = require('./lib/tasks/aggregators/start');

program
  .option('-e, --entry-point <entry>', 'entry point of the application', suffix('.js'), 'index.js')
  .option('-n, --no-server', 'run without starting entry-point')
  .option('-w, --watch', 'deprecated, for backward comp.')
  .option('-s, --silent', 'deprecated, for backward comp.')
  .parse(process.argv);

run(program)(start);
