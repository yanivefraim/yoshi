'use strict';

const {CLIEngine} = require('eslint');
const globs = require('../globs');

function eslint({dirs = globs.eslint()}) {
  return Promise.resolve().then(() => {
    const cli = new CLIEngine();
    const results = cli.executeOnFiles(dirs).results;
    const formatter = cli.getFormatter();
    const errors = CLIEngine.getErrorResults(results);
    console.log(formatter(results));
    return errors.length && Promise.reject();
  });
}

module.exports = eslint;
