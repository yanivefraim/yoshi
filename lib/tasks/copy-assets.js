'use strict';

const path = require('path');
const gulp = require('gulp');
const {watchMode, normalizeGlobDirList} = require('../utils');
const globs = require('../globs');

const watch = watchMode();

function copyDir(source, destination = '', base = '.') {
  return new Promise((resolve, reject) =>
    gulp.src(source, {base})
      .pipe(gulp.dest(path.join('dist', destination)))
      .on('error', reject)
      .once('end', resolve)
  );
}

function copyAssets({context = 'src', output = 'statics', dirs} = {}) {
  const baseDir = dirs ?
    normalizeGlobDirList(dirs) :
    globs.base();

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
