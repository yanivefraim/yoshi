'use strict';

const jestCli = require('jest-cli');
const config = require('../../config/project').jestConfig();
const {watchMode, inTeamCity} = require('../utils');

function jest() {
  const watch = watchMode();

  if (inTeamCity()) {
    config.testResultsProcessor = 'node_modules/jest-teamcity-reporter';
    process.argv.push('--teamcity');
  }

  return new Promise((resolve, reject) => {
    jestCli.runCLI({watch, config}, process.cwd(), result => {
      result.success ? resolve() : reject('jest failed');
    });
  });
}

module.exports = jest;
