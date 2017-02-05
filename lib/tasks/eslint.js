'use strict';

const gulp = require('gulp');
const gulpEslint = require('gulp-eslint');
const globs = require('../globs');

function eslint(options) {
  const files = options.dirs ?
    options.dirs :
    globs.eslint();

  return new Promise((resolve, reject) =>
    gulp.src(files)
      .pipe(gulpEslint())
      .pipe(gulpEslint.format())
      .pipe(gulpEslint.failAfterError())
      .on('error', reject)
      .once('end', resolve)
  );
}

module.exports = eslint;
