'use strict';

const path = require('path');
const fs = require('fs');
const sass = require('node-sass');
const mkdirp = require('mkdirp').sync;
const utils = require('./utils');
const globs = require('./globs');
const gutil = require('gulp-util');

function run() {
  const files = utils.files(globs.sass());
  if (files.length) {
    gutil.log('Compiling with Sass');
    return Promise.all(files.map(renderFile));
  } else {
    return Promise.resolve();
  }
}

function renderFile(file) {
  const outFile = path.resolve('dist', file.replace(/\.s[c|a]ss/i, '.css'));
  const options = {
    file: path.resolve(file),
    outFile,
    includePaths: ['.', 'node_modules', path.dirname(file)],
    sourceMap: path.resolve(file),
    sourceMapContents: true,
    omitSourceMapUrl: true,
    indentedSyntax: path.extname(file) === '.sass'
  };

  return new Promise((resolve, reject) => {
    sass.render(options, (err, result) => {
      if (err) {
        reject(err);
      } else {
        // TODO: emit source maps
        mkdirp(path.dirname(outFile));
        fs.writeFileSync(outFile, result.css);
        resolve(result);
      }
    });
  });
}

module.exports = {run};
