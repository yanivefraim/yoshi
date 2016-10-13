'use strict';

module.exports = (gulp, plugins, options) => {
  require('../clean')(gulp, plugins, options);
  gulp.task('clean', ['clean:dist']);
};
