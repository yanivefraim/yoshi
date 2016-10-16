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
      .pipe(plugins.tslint({reporter: 'prose'}))
      .pipe(plugins.tslint.report({emitError: !options.watch && !process.env.WATCH_MODE}));
  });
