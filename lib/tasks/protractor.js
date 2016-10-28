'use strict';

const protractor = require('../protractor');

module.exports = (gulp, plugins) => {
  gulp.task('protractor', () => {
    if (!protractor.hasConfFile()) {
      plugins.util.log('Protractor configurations file was not found, not running e2e.');
    } else {
      plugins.util.log('Running E2E with Protractor');
      return protractor.run();
    }
  });
};
