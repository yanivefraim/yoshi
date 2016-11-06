'use strict';

const globs = require('../globs');

module.exports = (gulp, plugins, options) =>
  gulp.task('tslint', () => {
    plugins.util.log('Linting with TSLint');

    const files = options.dirs ?
        options.dirs :
        globs.tslint();

    return gulp.src(files, {base: '.'})
      .pipe(plugins.tslint({formatter: 'prose'}))
      .pipe(plugins.tslint.report({emitError: true, summarizeFailureOutput: true}));
  });
