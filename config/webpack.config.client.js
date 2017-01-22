'use strict';

const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const {mergeByConcat, isSingleEntry} = require('../lib/utils');
const webpackConfigCommon = require('./webpack.config.common');
const projectConfig = require('./project');
const DynamicPublicPath = require('../lib/plugins/dynamic-public-path');

const config = ({debug, separateCss = projectConfig.separateCss()} = {}) => {
  const cssModules = projectConfig.cssModules();
  const tpaStyle = projectConfig.tpaStyle();
  const extractCSS = getExtractCss();

  return mergeByConcat(webpackConfigCommon, {
    entry: getEntry(),

    module: {
      loaders: [
        require('../lib/loaders/sass')(extractCSS, cssModules, tpaStyle).client
      ]
    },

    plugins: [
      new webpack.optimize.OccurenceOrderPlugin(),
      new DynamicPublicPath(),

      new webpack.DefinePlugin({
        'process.env.NODE_ENV': debug ? '"development"' : '"production"'
      }),

      ...extractCSS ? [extractCSS] : [],

      ...debug ? [] : [
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: false,
          },
        })
      ]
    ],

    devtool: debug ? 'cheap-module-source-map' : 'source-map',

    output: {
      path: path.resolve('./dist/statics'),
      filename: debug ? '[name].bundle.js' : '[name].bundle.min.js',
      chunkFilename: debug ? '[name].chunk.js' : '[name].chunk.min.js',
      pathinfo: debug
    },

    postcss: () => [autoprefixer],

    target: 'web'
  });

  function getExtractCss() {
    if (separateCss) {
      const ExtractTextPlugin = require('extract-text-webpack-plugin');
      return new ExtractTextPlugin(debug ? '[name].css' : '[name].min.css');
    }
  }
};

function getEntry() {
  const entry = projectConfig.entry() || projectConfig.defaultEntry();
  return isSingleEntry(entry) ? {app: entry} : entry;
}

module.exports = config;
