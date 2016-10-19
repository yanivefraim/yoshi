#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<process>')
  .command('start [entryPoint]', 'start the application')
  .command('release', 'bump package.json')
  .command('build', 'build the application')
  .command('clean', 'remove unnecessary filder/folders')
  .command('test', 'test the application')
  .command('e2e', 'running e2e with protractor')
  .command('dev', 'for dev time purposes @ watch, lint, build and unit test')
  .command('lint', 'lints the code')
  .parse(process.argv);
