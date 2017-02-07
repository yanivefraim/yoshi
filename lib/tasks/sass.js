/*
'use strict';

// TODO: emit source maps

const path = require('path');
const nodeSass = require('node-sass');
const gulp = require('gulp');
const globs = require('../globs');
const {watchMode, files, writeFile} = require('../utils');

const watch = watchMode();

module.exports = sass;

function sass({context}) {
  const glob = globs.sass(context);

  if (watch) {
    gulp.watch(glob, () => transpile(files));
  }

  return transpile(glob);
}

function transpile(glob) {
  const fileList = files(glob);
  return Promise.all(fileList.map(renderFile));
}

function renderFile(file) {
  const options = {
    file: path.resolve(file),
    includePaths: ['.', 'node_modules', path.dirname(file)],
    indentedSyntax: path.extname(file) === '.sass'
  };

  return new Promise((resolve, reject) => {
    nodeSass.render(options, (err, result) => {
      if (err) {
        reject(err.formatted);
      } else {
        writeFile(path.resolve('dist', file), result.css);
        resolve(result);
      }
    });
  });
}
*/

'use strict';

const _ = require('lodash/fp');
const gulp = require('gulp');
const gulpSass = require('gulp-sass');
const rename = require('gulp-rename');
const globs = require('../globs');
const {watchMode} = require('../utils');

const watch = watchMode();

function sass({context}) {
  const files = globs.sass(context);

  if (watch) {
    gulp.watch(files, () => transpile(files));
  }

  return transpile(files);
}

function transpile(files) {
  const options = {
    includePaths: ['.', 'node_modules']
  };

  return new Promise((resolve, reject) => {
    return gulp.src(files, {base: './'})
      .pipe(gulpSass(options).on('error', _.compose(reject, gulpSass.logError)))
      .pipe(rename({extname: '.scss'}))
      .pipe(gulp.dest('dist'))
      .once('end', resolve);
  });
}

module.exports = sass;
