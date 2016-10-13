'use strict';
const gulpTypings = require('../hotfix/gulp-typings');

module.exports = (gulp, plugins) =>
  gulp.task('typings-install', () => {
    plugins.util.log('Installing Typings from typings.json');

    return gulp.src('./typings.json')
      .pipe(gulpTypings());
  });
