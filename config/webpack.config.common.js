'use strict';

const path = require('path');
const context = path.resolve('./src');
const projectConfig = require('./project');

const config = {
  context,

  output: {
    path: path.resolve('./dist')
  },

  resolve: {
    root: context,
    extensions: ['', '.ts', '.js', '.tsx', '.jsx']
  },

  resolveLoader: {
    root: path.join(__dirname, '..', 'node_modules')
  },

  module: {
    loaders: [
      require('../lib/loaders/babel')(projectConfig.isAngularProject()),
      require('../lib/loaders/typescript')(projectConfig.isAngularProject()),
      require('../lib/loaders/images')(),
      require('../lib/loaders/json')()
    ]
  },

  devtool: 'source-map',

  externals: projectConfig.externals()
};

module.exports = config;
