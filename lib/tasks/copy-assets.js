'use strict';

const path = require('path');
const utils = require('../utils');
const globs = require('../globs');

module.exports = (gulp, plugins, options) => {
  const context = options.context || 'src';
  const output = options.output || 'statics';

  const baseDir = options.dirs ?
    utils.normalizeGlobDirList(options.dirs) :
    globs.base();

  const assets = `${baseDir}/assets/**/*`;
  const htmlAssets = `${baseDir}/**/*.{ejs,html,vm}`;
  const serverAssets = `${baseDir}/**/*.{scss,css,json,d.ts}`;

  gulp.task('_copy-assets-to-dist', () => {
    return gulp
      .src([assets, htmlAssets, serverAssets], {
        base: '.'
      })
      .pipe(gulp.dest('dist'));
  });

  gulp.task('_copy-assets-to-statics', () => {
    return gulp
      .src([assets, htmlAssets], {
        base: path.join(process.cwd(), context)
      })
      .pipe(gulp.dest(path.join('dist', output)));
  });

  gulp.task('copy-assets-to-dist:watch', ['_copy-assets-to-dist'], () => {
    gulp.watch([
      assets,
      htmlAssets,
      serverAssets
    ], ['_copy-assets-to-dist']);
  });

  gulp.task('copy-assets-to-statics:watch', ['_copy-assets-to-statics'], () => {
    gulp.watch([
      assets,
      htmlAssets
    ], ['_copy-assets-to-statics']);
  });

  gulp.task('copy-assets-to-dist',
    utils.watchMode() ?
    ['copy-assets-to-dist:watch'] :
    ['_copy-assets-to-dist']
  );

  gulp.task('copy-assets-to-statics',
    utils.watchMode() ?
    ['copy-assets-to-statics:watch'] :
    ['_copy-assets-to-statics']
  );

  gulp.task('copy-assets', [
    'copy-assets-to-dist',
    'copy-assets-to-statics'
  ]);
};
