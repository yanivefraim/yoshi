'use strict';

const path = require('path');
const gulp = require('gulp');
const {watchMode} = require('../utils');
const globs = require('../globs');

const watch = watchMode();
const baseDir = globs.base();

function copyDir(source, destination = '', base = '.') {
  return new Promise((resolve, reject) =>
    gulp.src(source, {base})
      .pipe(gulp.dest(path.join('dist', destination)))
      .on('error', reject)
      .once('end', resolve)
  );
}

function copyAssets({context = 'src', output = 'statics'} = {}) {
  const assets = `${baseDir}/assets/**/*`;
  const htmlAssets = `${baseDir}/**/*.{ejs,html,vm}`;
  const serverAssets = `${baseDir}/**/*.{css,json,d.ts}`;

  const copyAllAssets = () => Promise.all([
    copyDir([assets, htmlAssets, serverAssets]),
    copyDir([assets, htmlAssets], output, path.join(process.cwd(), context))
  ]);

  if (watch) {
    gulp.watch([assets, htmlAssets, serverAssets], copyAllAssets);
  }

  return copyAllAssets();
}

module.exports = copyAssets;
