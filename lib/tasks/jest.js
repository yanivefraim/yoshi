'use strict';

const jest = require('jest-cli');
const {watchMode} = require('../utils');
const inTeamCity = require('../utils').inTeamCity;

module.exports = (gulp, plugins) =>
  gulp.task('jest', done => {
    plugins.util.log('Testing with Jest');

    const watch = watchMode();

    jest.runCLI({watch, testResultsProcessor: inTeamCity() ? 'node_modules/jest-teamcity-reporter' : undefined}, process.cwd(), result => {
      result.success ? done() : done('jest failed');
    });
  });
