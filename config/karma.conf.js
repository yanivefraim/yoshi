'use strict';

const path = require('path');
const tryRequire = require('../lib/utils').tryRequire;
const _ = require('lodash');

module.exports = function (config) {
  const projectConfig = tryRequire(path.resolve('karma.conf.js')) || {files: []};
  const baseConfig = {
    basePath: process.cwd(),
    browsers: ['PhantomJS'],
    frameworks: ['mocha'],
    singleRun: true,
    files: [
      'node_modules/phantomjs-polyfill/bind-polyfill.js',
      'dist/specs.bundle.js'
    ],
    exclude: [],
    plugins: [
      require('karma-jasmine'),
      require('karma-mocha'),
      require('karma-phantomjs-launcher'),
      require('karma-chrome-launcher')
    ],
    colors: true
  };

  const merged = _.mergeWith(baseConfig, projectConfig, customizer);
  config.set(merged);
};

function customizer(a, b) {
  let result;
  if (_.isArray(a)) {
    result = a.slice();
    result.unshift.apply(result, b);
  }
  return result;
}
