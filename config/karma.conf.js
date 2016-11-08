'use strict';

const _ = require('lodash');
const path = require('path');
const {tryRequire, inTeamCity, watchMode} = require('../lib/utils');
const globs = require('../lib/globs');

const specsGlob = globs.specs();

const baseConfig = {
  basePath: process.cwd(),
  browsers: ['PhantomJS'],
  frameworks: ['mocha'],
  singleRun: !watchMode(),
  files: [
    'node_modules/phantomjs-polyfill/bind-polyfill.js',
    specsGlob
  ],
  preprocessors: {
    [specsGlob]: ['webpack']
  },
  webpack: require('./webpack.config.specs'),
  exclude: [],
  plugins: [
    require('karma-webpack'),
    require('karma-jasmine'),
    require('karma-mocha'),
    require('karma-phantomjs-launcher'),
    require('karma-chrome-launcher')
  ],
  colors: true
};

const teamCityConfig = {
  plugins: [require('karma-teamcity-reporter')],
  reporters: ['teamcity']
  // coverageReporter: {
  //   reporters: [{type: 'teamcity'}]
  // }
};

module.exports = config => {
  const projectConfig = tryRequire(path.resolve('karma.conf.js')) || {files: []};
  const configuration = inTeamCity() ? _.mergeWith(baseConfig, teamCityConfig, customizer) : baseConfig;
  const merged = _.mergeWith(configuration, projectConfig, customizer);
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
