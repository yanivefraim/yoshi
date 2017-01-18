'use strict';

const globs = require('../globs');
const {noop, normalizeGlobDirList, watchMode} = require('../utils');
const path = require('path');
const mkdirp = require('mkdirp');
const gulp = require('gulp');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const fileTransformCache = require('gulp-file-transform-cache');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');

module.exports = {run, watch, transpile};

function run({dirs, done} = {}) {
  const result = transpile(dirs, done);
  return watchMode() ? result.then(() => watch(dirs, done)) : result;
}

function watch(dirs, done = noop) {
  gulp.watch(toGlob(dirs), () => transpile(dirs, done));
}

function transpile(dirs, done = noop) {
  gutil.log('Compiling with Babel');

  mkdirp(path.resolve('target'));

  return new Promise((resolve, reject) => {
    // gulp-babel emits error on every compilation error,
    // so we have to print these errors manually
    // nice workaround (?) to have a full and detailed compilation errors
    // we use it to resolve or reject the returned promise
    const interceptor = createInterceptor(resolve, reject);

    gulp.src(toGlob(dirs), {base: '.'})
      .pipe(interceptor.catchErrors())
      .pipe(fileTransformCache({
        path: path.resolve('target', '.babel-cache'),
        transformStreams: [sourcemaps.init(), babel()]
      }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('dist'))
      .once('end', interceptor.flush);
  }).then(done);
}

function toGlob(dirs) {
  const glob = typeof dirs === 'string' ? normalizeGlobDirList(dirs) : null;
  return globs.babel(glob);
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
        throwBuildError();
      } else {
        resolve();
      }
    }
  };
}

function printErrors(err) {
  const styledError = err.plugin === 'gulp-babel' ? `\n${err.codeFrame}` : '';
  const message = `${gutil.colors.red(err.message)}${styledError}`;
  gutil.log(message);
}

function throwBuildError() {
  if (!watchMode()) {
    throw new gutil.PluginError('WixBabelTask', {message: 'Something broke in build process, see above for further details'});
  }
}
