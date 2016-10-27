'use strict';

const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const {mergeByConcat} = require('./../lib/utils');
const webpackConfigCommon = require('./webpack.config.common');
const {bundleEntry, separateCss, cssModules} = require('./project');

const config = ({debug} = {}) => {
  const extractCSS = getExtractCss();
  const cssmodules = cssModules();
  const sass = require('../lib/loaders/sass')(extractCSS, cssmodules);

  return mergeByConcat(webpackConfigCommon, {
    entry: bundleEntry(),

    module: {
      loaders: [sass.client]
    },

    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': debug ? '"development"' : '"production"'
      }),

      ...extractCSS ? [extractCSS] : [],

      ...debug ? [] : [
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: true,
          },
        })
      ]
    ],

    output: {
      path: path.resolve('./dist/statics'),
      filename: debug ? '[name].bundle.js' : '[name].bundle.min.js'
    },

    postcss: () => [autoprefixer],

    target: 'web'
  });

  function getExtractCss() {
    if (separateCss()) {
      const ExtractTextPlugin = require('extract-text-webpack-plugin');
      return new ExtractTextPlugin(debug ? '[name].css' : '[name].min.css');
    }
  }
};

module.exports = config;
