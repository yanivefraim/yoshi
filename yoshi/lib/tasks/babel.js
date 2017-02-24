'use strict';

const path = require('path');
const mkdirp = require('mkdirp');
const gulp = require('gulp');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const fileTransformCache = require('gulp-file-transform-cache');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const globs = require('../globs');
const {noop, watchMode} = require('../utils');

const watch = watchMode();
const files = globs.babel();

function runBabel(done = noop) {
  return function babel() {
    const transpileThenDone = () => transpile().then(done);

    if (watch) {
      gulp.watch(files, transpileThenDone);
    }

    return transpileThenDone();
  };
}

function transpile() {
  return new Promise((resolve, reject) => {
    const interceptor = createInterceptor(resolve, reject);

    mkdirp(path.resolve('target'));

    gulp.src(files, {base: '.'})
      .pipe(interceptor.catchErrors())
      .pipe(fileTransformCache({
        path: path.resolve('target', '.babel-cache'),
        transformStreams: [sourcemaps.init(), babel()]
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('dist'))
      .once('end', interceptor.flush);
  });
}

function createInterceptor(resolve, reject) {
  let error;

  return {
    catchErrors: () => plumber(err => {
      error = err;
      printErrors(err);
    }),
    flush: () => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    }
  };
}

function printErrors(err) {
  const styledError = err.plugin === 'gulp-babel' ? `\n${err.codeFrame}` : '';
  const message = `${gutil.colors.red(err.message)}${styledError}`;
  console.log(message);
}

module.exports = runBabel;
