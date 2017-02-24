'use strict';

const gulp = require('gulp');
const gulpJasmine = require('gulp-jasmine');
const projectConfig = require('../../config/project');
const globs = require('../globs');
const {inTeamCity} = require('../utils');

function jasmine() {
  process.env.NODE_ENV = 'test';
  process.env.SRC_PATH = './src';

  const jasmineGlobs = projectConfig.specs.node() || globs.specs();
  const settings = {/*includeStackTrace: true, */errorOnFail: true};

  if (inTeamCity()) {
    const TeamCityReporter = require('jasmine-reporters').TeamCityReporter;
    settings.reporter = new TeamCityReporter();
  }

  return new Promise((resolve, reject) => {
    gulp.src(jasmineGlobs)
      .pipe(gulpJasmine(settings))
      .on('error', reject)
      .once('jasmineDone', resolve);
  });
}

module.exports = jasmine;
