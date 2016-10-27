'use strict';

const runSequence = require('run-sequence');
const utils = require('../../utils');
const jest = require('../jest');
module.exports = (gulp, plugins, options) => {
  require('../mocha')(gulp, plugins, options);
  require('../jasmine')(gulp, plugins, options);
  require('../protractor')(gulp, plugins, options);
  require('../karma')(gulp, plugins, options);
  require('../bundle')(gulp, plugins, options);

  gulp.task('test:mocha', cb => runSequence('mocha', utils.handleRunSequenceErrors(cb)));
  gulp.task('test:jasmine', cb => runSequence('jasmine', utils.handleRunSequenceErrors(cb)));
  gulp.task('test:jest', jest);
  gulp.task('test:karma', cb => runSequence('bundle:specs', 'karma', utils.handleRunSequenceErrors(cb)));
  gulp.task('test:protractor', cb => runSequence('protractor', utils.handleRunSequenceErrors(cb)));
  gulp.task('test', cb => runSequence('mocha', 'protractor', utils.handleRunSequenceErrors(cb)));
};

