'use strict';

const fs = require('fs');
const {Linter, Configuration} = require('tslint');
const globs = require('../globs');
const {readDir} = require('../utils');

const options = {fix: false, formatter: 'prose'};
const files = globs.tslint();

module.exports = tslint;

function tslint() {
  return Promise
    .all(readDir(files).filter(file => !file.match(/\.d\.ts$/)).map(lint))
    .then(results => {
      const output = results.reduce((acc, result) => acc + result.output, '');
      const errorCount = results.reduce((acc, result) => acc + result.failureCount, 0);
      if (errorCount) {
        console.log(`${output}\n${errorCount} error(s)\n`);
        return Promise.reject();
      }
    });
}

function lint(file) {
  return readFile(file).then(content => {
    const linter = new Linter(options);
    const config = Configuration.findConfiguration(null, file).results;
    linter.lint(file, content, config);
    return linter.getResult();
  });
}

// TODO: introduce generic module for reading a file
function readFile(file) {
  return new Promise((resolve, reject) =>
    fs.readFile(file, 'utf8', (err, content) =>
      err ? reject(err) : resolve(content)));
}
