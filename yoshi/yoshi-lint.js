#!/usr/bin/env node

const {watchMode} = require('./lib/utils');

if (watchMode()) {
  process.exit(0);
}

const program = require('commander');
const run = require('./lib/run');
const lint = require('./lib/tasks/aggregators/lint');

program
	.option('--client', 'special linters for client only: stylelint')
	.parse(process.argv);

run(program)(lint);
