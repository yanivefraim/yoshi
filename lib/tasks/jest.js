'use strict';

const jest = require('jest-cli');
const {watchMode} = require('../utils');

module.exports = (gulp, plugins) =>
  gulp.task('jest', done => {
    plugins.util.log('Testing with Jest');

    const watch = watchMode();

    jest.runCLI({watch}, process.cwd(), result => {
      result.success ? done() : done('jest failed');
    });
  });
