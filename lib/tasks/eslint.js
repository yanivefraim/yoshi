'use strict';

const {CLIEngine} = require('eslint');
const globs = require('../globs');

function eslint({dirs}) {
  return Promise.resolve().then(() => {
    const files = dirs || globs.eslint();
    const cli = new CLIEngine();
    const results = cli.executeOnFiles(files).results;
    const formatter = cli.getFormatter();
    const errors = CLIEngine.getErrorResults(results);
    console.log(formatter(results));
    return errors.length && Promise.reject();
  });
}

module.exports = eslint;
