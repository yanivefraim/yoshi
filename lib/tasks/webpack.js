'use strict';

const _ = require('lodash/fp');
const path = require('path');
const gutil = require('gulp-util');
const webpack = require('webpack');
const {exists} = require('../utils');
const webpackConfig = require('../../config/webpack.config.client');

const compiler = ({debug} = {}) => {
  gutil.log(`Bundling with Webpack (${debug ? 'debug' : 'release'})`);

  const configurations = [webpackConfig]
    .map(config => config({debug}))
    .filter(hasEntries);

  return webpack(configurations);
};

const run = options => {
  return new Promise((resolve, reject) => {
    compiler(options).run((err, stats) => {
      if (err || stats.hasErrors()) {
        gutil.log(gutil.colors.red(stats.toJson({}, true).errors.join('\n')));
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
};

module.exports = {
  compiler,
  run
};

function hasEntriesWithExtensions(extensions) {
  return entry => {
    return extensions
      .map(ext => `${entry}.${ext}`).concat(entry)
      .map(exists)
      .some(_.identity);
  };
}

function hasEntries(webpackConfig) {
  const entry = webpackConfig.entry;
  const context = webpackConfig.context;

  return _.values(entry)
    .map(entry => path.join(context, entry))
    .map(hasEntriesWithExtensions(['js', 'ts', 'tsx']))
    .every(_.identity);
}
