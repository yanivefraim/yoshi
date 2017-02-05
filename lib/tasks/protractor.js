'use strict';

const gutil = require('gulp-util');
const {watchMode} = require('../utils');
const {hasConfFile, run} = require('../protractor');

const watch = watchMode();

function protractor() {
  if (watch) {
    gutil.log('Protractor will not run in watch mode.');
    return Promise.resolve();
  }

  if (!hasConfFile()) {
    gutil.log('Protractor configurations file was not found, not running e2e.');
    return Promise.resolve();
  }

  gutil.log('Running E2E with Protractor');
  return run();
}

module.exports = protractor;
