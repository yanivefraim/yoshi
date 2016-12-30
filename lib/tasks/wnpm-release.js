'use strict';

const wnpm = require('wnpm-ci');

module.exports = gulp =>
  gulp.task('wnpm-release', done => wnpm.prepareForRelease({
    shouldShrinkWrap: false
  }, done));
