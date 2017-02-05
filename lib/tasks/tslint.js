'use strict';

const gulp = require('gulp');
const gulpTslint = require('gulp-tslint');
const globs = require('../globs');

function tslint(options) {
  const files = options.dirs ?
    options.dirs :
    globs.tslint();

  return new Promise((resolve, reject) =>
    gulp.src(files, {base: '.'})
      .pipe(gulpTslint({formatter: 'prose'}))
      .pipe(gulpTslint.report({emitError: true, summarizeFailureOutput: true}))
      .on('error', reject)
      .once('end', resolve)
  );
}

module.exports = tslint;
