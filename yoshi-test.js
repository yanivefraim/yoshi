#!/usr/bin/env node
'use strict';

const _ = require('lodash');
const program = require('commander');
const run = require('./lib/run');
const test = require('./lib/tasks/aggregators/test');

program
  .option('--mocha', 'run unit tests on mocha')
  .option('--jasmine', 'run unit tests on jasmine')
  .option('--karma', 'run unit tests on karma')
  .option('--jest', 'run unit tests on qjest')
  .option('--protractor', 'run e2e on protractor')
  .option('--watch', 'watch for changes')
  .parse(process.argv);

run(program)(test);
