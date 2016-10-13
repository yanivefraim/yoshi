'use strict';

const process = require('process');
const globs = require('../globs');

module.exports = (gulp, plugins, options) =>
  gulp.task('tslint', () => {
    plugins.util.log('Linting with TSLint');

    const files = options.dirs ?
        options.dirs :
        globs.tslint();

    return gulp.src(files, {base: '.'})
      .pipe(plugins.tslint())
      .pipe(plugins.tslint.report('prose'))
      .on('error', function (e) {
        // NOTE: gulp-tslint emits error after reporting on all files
        if (options.watch || process.env.WATCH_MODE) {
          this.emit('end');
        } else {
          throw e;
        }
      });
  });
