'use strict';

const path = require('path');
const context = path.resolve('./src');
const projectConfig = require('./project');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');

const config = {
  context,

  output: getOutput(),

  resolve: {
    root: context,
    extensions: ['', '.ts', '.js', '.tsx', '.jsx']
  },

  resolveLoader: {
    root: path.join(__dirname, '..', 'node_modules')
  },

  plugins: [
    new CaseSensitivePathsPlugin()
  ],

  module: {
    loaders: [
      require('../lib/loaders/babel')(projectConfig.isAngularProject()),
      require('../lib/loaders/typescript')(projectConfig.isAngularProject()),
      require('../lib/loaders/graphql')(),
      require('../lib/loaders/images')(),
      require('../lib/loaders/json')(),
      require('../lib/loaders/html')(),
      require('../lib/loaders/raw')()
    ]
  },

  devtool: 'source-map',

  externals: projectConfig.externals()
};

function getOutput() {
  const libraryExports = projectConfig.exports();
  const output = {
    path: path.resolve('./dist'),
    pathinfo: true
  };

  if (libraryExports) {
    return Object.assign({}, output, {
      library: libraryExports,
      libraryTarget: 'umd'
    });
  }

  return output;
}

module.exports = config;
