'use strict';

const del = require('del');

function cleanDir(dir) {
  return del([`${dir}/**`, `!${dir}`]);
}

function clean() {
  return Promise.all([
    cleanDir('dist'),
    cleanDir('target')
  ]);
}

module.exports = clean;
