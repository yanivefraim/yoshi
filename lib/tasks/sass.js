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
