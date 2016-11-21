'use strict';

const jest = require('jest-cli');
const config = require('../../config/project').jestConfig();
const {watchMode} = require('../utils');
const inTeamCity = require('../utils').inTeamCity;

module.exports = (gulp, plugins) =>
  gulp.task('jest', done => {
    plugins.util.log('Testing with Jest');

    const watch = watchMode();
    if (inTeamCity()) {
      config.testResultsProcessor = 'node_modules/jest-teamcity-reporter';
      process.argv.push('--teamcity');
    }

    jest.runCLI({watch, config}, process.cwd(), result => {
      result.success ? done() : done('jest failed');
    });
  });
