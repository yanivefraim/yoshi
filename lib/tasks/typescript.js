'use strict';

const typescript = require('typescript');
const {normalizeGlobDirList, noop, watchMode} = require('../utils');
const globs = require('../globs');
const glob = require('glob');
const _ = require('lodash');
const gulp = require('gulp');
const gutil = require('gulp-util');
const gtypescript = require('gulp-typescript');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');

module.exports = {run, watch, transpile};

function run({dirs, done} = {}) {
  const result = transpile(dirs, done);
  return watchMode() ? result.then(() => watch(dirs, done)) : result;
}

function watch(dirs, done = noop) {
  gulp.watch(toGlob(dirs), () => transpile(dirs, done));
}

function transpile(dirs, done = noop) {
  gutil.log('Compiling TypeScript @', typescript.version);

  const tsProject = gtypescript.createProject('tsconfig.json');
  let files = toGlob(dirs)
    .concat(tsProject.config.include || [])
    .map(f => glob.sync(f, {ignore: tsProject.config.exclude || []}));
  files = _.flatten(files);

  return new Promise((resolve, reject) => {
    // nice workaround (?) to have a full and detailed compilation errors
    // we use it to resolve or reject the returned promise
    // the way we detect typescript error, it handles errors in his own
    // so we should not print them
    const interceptor = createInterceptor(resolve, reject);

    gulp.src(files, {base: '.'})
      .pipe(interceptor.catchErrors())
      .pipe(sourcemaps.init())
      .pipe(tsProject())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('dist/'))
      .once('finish', interceptor.flush);
  }).then(done);
}

function toGlob(dirs) {
  const gl = typeof dirs === 'string' ? normalizeGlobDirList(dirs) : null;
  return globs.typescript(gl);
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
  if (!err.tsFile) {
    console.log(err.message);
  }
}

function throwBuildError() {
  if (!watchMode()) {
    throw new gutil.PluginError('WixTypeScriptTask', {
      message: 'Something broke in build process, see above for further details'
    });
  }
}
