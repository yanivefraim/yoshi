'use strict';

module.exports = (gulp, plugins) =>
  gulp.task('wnpm-release', plugins.shell.task('wnpm-release --no-shrinkwrap'));
