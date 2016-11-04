'use strict';
const path = require('path');
const webpackConfigCommon = require('./webpack.config.common');
const mergeByConcat = require('../lib/utils').mergeByConcat;
const {cssModules} = require('./project');

module.exports = mergeByConcat(webpackConfigCommon, {
  output: {
    path: path.resolve('dist'),
    filename: 'specs.bundle.js'
  },
  module: {
    loaders: [
      require('../lib/loaders/sass')(false, cssModules()).server
    ]
  },
  externals: {
    cheerio: 'window',
    'react/addons': true,
    'react/lib/ExecutionEnvironment': true,
    'react/lib/ReactContext': true
  }
});
