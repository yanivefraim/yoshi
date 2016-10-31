'use strict';

const _ = require('lodash/fp');
const path = require('path');
const gutil = require('gulp-util');
const webpack = require('webpack');
const {exists} = require('../utils');
const webpackConfig = require('../../config/webpack.config.client');

const compiler = options => {
  gutil.log(`Bundling with Webpack (${options.debug ? 'debug' : 'release'})`);

  const configurations = [webpackConfig]
    .map(config => config(options))
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
      .some(exists);
  };
}

function hasEntries(webpackConfig) {
  const entries = webpackConfig.entry;
  const context = webpackConfig.context;

  return _(entries)
    .values()
    .map(entry => _.isArray(entry) ? entry : [entry])
    .every(
      modules => _(modules)
        .map(module => path.join(context, module))
        .some(hasEntriesWithExtensions(['js', 'ts', 'tsx']))
  );
}
