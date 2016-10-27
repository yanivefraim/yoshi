#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<process>')
  .command('start [entryPoint]', 'start the application')
  .command('release', 'bump package.json')
  .command('build', 'build the application')
  .command('test', 'test the application')
  .command('lint', 'lints the code')
  .parse(process.argv);
