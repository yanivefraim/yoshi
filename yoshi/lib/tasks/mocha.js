'use strict';

const path = require('path');
const gulp = require('gulp');
const spawnMocha = require('gulp-spawn-mocha');
const {watchMode} = require('../utils');
const projectConfig = require('../../config/project');
const globs = require('../globs');
const {inTeamCity} = require('../utils');

const watch = watchMode();
const mochaGlobs = projectConfig.specs.node() || globs.specs();

function runMocha() {
  return new Promise((resolve, reject) =>
    gulp.src(mochaGlobs, {read: false})
      .pipe(spawnMocha({
        env: {NODE_ENV: 'test', SRC_PATH: './src'},
        reporter: inTeamCity() ? 'mocha-teamcity-reporter' : 'progress',
        timeout: 30000,
        require: [
          path.join(__dirname, '..', 'require-hooks'),
          path.join(__dirname, '..', 'setup', 'mocha-setup')
        ]
      }))
      .on('error', reject)
      .once('end', resolve)
  );
}

function mocha() {
  if (watch) {
    gulp.watch(`${globs.base()}/**/*`, runMocha);
  }

  return runMocha();
}

module.exports = mocha;
