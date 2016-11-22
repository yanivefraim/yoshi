'use strict';

const _ = require('lodash/fp');
const path = require('path');
const gutil = require('gulp-util');
const webpack = require('webpack');
const webpackMiddleware = require('webpack-dev-middleware');
const getConfig = require('../../config/webpack.config.client');
const {entry, defaultEntry} = require('../../config/project');
const {exists, filterNoise} = require('../utils');
const {start} = require('../server-api');

const existsJs = pattern => exists(`${pattern}.{js,jsx,ts,tsx}`);
const filteredWebpack = _.compose(filterNoise, webpack);

const getCompiler = options => {
  const config = getConfig(options);
  const defaultEntryPath = path.join(config.context, defaultEntry());

  if (entry() || existsJs(defaultEntryPath)) {
    gutil.log(`Bundling with Webpack (${options.debug ? 'debug' : 'release'})`);
    return filteredWebpack(config);
  }

  return filteredWebpack({output: {path: '/'}});
};

const runWebpack = options => {
  return new Promise((resolve, reject) =>
    getCompiler(options).run((err, stats) => err || stats.hasErrors() ? reject(err) : resolve())
  );
};

const startWebpack = options => {
  const compiler = getCompiler(options);
  const middleware = [webpackMiddleware(compiler, {quiet: true})];

  return start({middleware});
};

module.exports = {runWebpack, startWebpack};
