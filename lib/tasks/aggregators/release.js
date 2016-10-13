'use strict';

module.exports = (gulp, plugins, options) => {
  require('../wnpm-release')(gulp, plugins, options);

  gulp.task('release', ['wnpm-release']);
};
