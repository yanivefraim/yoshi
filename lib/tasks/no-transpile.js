'use strict';

const gulp = require('gulp');
const globs = require('../globs');
const {noop, normalizeGlobDirList, watchMode} = require('../utils');

const watch = watchMode();

function transpile() {
  return Promise.resolve();
}

function runNoTranspile(done = noop) {
  return function noTranspile({dirs}) {
    const transpileThenDone = () => transpile().then(done);

    if (watch) {
      gulp.watch(toGlob(dirs), transpileThenDone);
    }

    return transpileThenDone();
  };
}

function toGlob(dirs) {
  const glob = typeof dirs === 'string' ? normalizeGlobDirList(dirs) : null;
  return globs.babel(glob);
}

module.exports = runNoTranspile;
