'use strict';

const _ = require('lodash/fp');
const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const rename = require('gulp-rename');
const globs = require('../globs');
const {watchMode} = require('../utils');

const watch = watchMode();

function sass({context}) {
  const files = globs.sass(context);

  if (watch) {
    gulp.watch(files, () => transpile(files));
  }

  return transpile(files);
}

function transpile(files) {
  const options = {
    includePaths: ['.', 'node_modules']
  };

  return new Promise((resolve, reject) => {
    return gulp.src(files, {base: './'})
      .pipe(gulpSass(options).on('error', _.compose(reject, gulpSass.logError)))
      .pipe(rename({extname: '.scss'}))
      .pipe(gulp.dest('dist'))
      .once('end', resolve);
  });
}

module.exports = sass;
