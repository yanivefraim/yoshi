'use strict';

const globs = require('../globs');
const {noop, normalizeGlobDirList, watchMode} = require('../utils');
const gulp = require('gulp');

module.exports = {run, watch, transpile};

function run({dirs, done} = {}) {
  const result = transpile(done);
  return watchMode() ? result.then(() => watch(dirs, done)) : result;
}

function watch(dirs, done = noop) {
  gulp.watch(toGlob(dirs), () => transpile(done));
}

function transpile(done = noop) {
  return Promise.resolve().then(done);
}

function toGlob(dirs) {
  const glob = typeof dirs === 'string' ? normalizeGlobDirList(dirs) : null;
  return globs.babel(glob);
}
