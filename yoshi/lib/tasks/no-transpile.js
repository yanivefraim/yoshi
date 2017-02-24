'use strict';

const gulp = require('gulp');
const globs = require('../globs');
const {noop, watchMode} = require('../utils');

const watch = watchMode();
const files = globs.babel();

function transpile() {
  return Promise.resolve();
}

function runNoTranspile(done = noop) {
  return function noTranspile() {
    const transpileThenDone = () => transpile().then(done);

    if (watch) {
      gulp.watch(files, transpileThenDone);
    }

    return transpileThenDone();
  };
}

module.exports = runNoTranspile;
