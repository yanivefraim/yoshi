'use strict';

const {watchMode} = require('../utils');
const globs = require('../globs');

module.exports = (gulp, plugins, {context}) => {
  const files = globs.sass(context);

  gulp.task('sass', watchMode() ? ['sass:watch'] : ['_sass']);

  gulp.task('sass:watch', ['_sass'], () => {
    gulp.watch(files, ['_sass']);
  });

  gulp.task('_sass', () => {
    plugins.util.log('Compiling with Sass');
    return gulp.src(files, {base: './'})
      .pipe(plugins.sass({
        includePaths: ['.', 'node_modules']
      }).on('error', handleErrors))
      .pipe(gulp.dest('dist'));
  });

  function handleErrors(err) {
    // gulp-sass does not emits error on AssertionError, but just display them
    // if there's an AssertionError, it emits an error at the end of the stream
    if (!watchMode()) {
      throw err;
    }

    this.emit('end');
  }
};
