'use strict';

module.exports = (gulp, plugins, options) => {
  require('../typings')(gulp, plugins, options);

  gulp.task('install', ['typings-install']);
};
