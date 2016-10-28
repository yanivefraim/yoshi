'use strict';

const _ = require('lodash/fp');
const path = require('path');
const gutil = require('gulp-util');
const webpack = require('webpack');
const {exists} = require('../utils');
const webpackConfig = require('../../config/webpack.config.client');
const express = require('express');
const webpackMiddleware = require('webpack-dev-middleware');
const projectConfig = require('../../config/project');

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

function start() {
  const port = projectConfig.servers.cdn.port();
  const clientFilesPath = projectConfig.clientFilesPath();
  const bundler = compiler({debug: true});

  express()
    .use(getCorsMiddleware())
    .use(getWebpackMiddleware(bundler))
    .use(express.static(clientFilesPath))
    .listen(port, 'localhost');
}

module.exports = {
  start,
  run
};

function getCorsMiddleware() {
  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');

    next();
  };
}

function getWebpackMiddleware(bundler) {
  try {
    return webpackMiddleware(bundler, {
      noInfo: true,
      stats: {
        colors: true
      }
    });
  } catch (e) {
    return (req, res, next) => next();
  }
}

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
