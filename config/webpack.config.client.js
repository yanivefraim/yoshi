'use strict';

const _ = require('lodash');
const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const {mergeByConcat} = require('../lib/utils');
const webpackConfigCommon = require('./webpack.config.common');
const {bundleEntry, separateCss, cssModules, servers} = require('./project');

const config = ({debug, hot} = {}) => {
  const entry = bundleEntry();
  const extractCSS = getExtractCss();
  const cssmodules = cssModules();
  const sass = require('../lib/loaders/sass')(extractCSS, cssmodules);

  return mergeByConcat(webpackConfigCommon, {
    entry: hot ? addHotEntries(entry) : entry,

    module: {
      loaders: [sass.client]
    },

    plugins: [
      ...hot ? [new webpack.HotModuleReplacementPlugin()] : [],

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

    output: {
      path: path.resolve('./dist/statics'),
      filename: debug ? '[name].bundle.js' : '[name].bundle.min.js',
      publicPath: hot ? `http://localhost:${servers.cdn.port()}/` : undefined
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

  function addHotEntries(entries) {
    return _.mapValues(entries, entry => {
      entry = _.isArray(entry) ? entry : [entry];
      return [
        require.resolve('webpack-hot-middleware/client') + '?dynamicPublicPath=true&path=__webpack_hmr&reload=true',
        require.resolve('webpack/hot/dev-server'),
        ...entry
      ];
    });
  }
};

module.exports = config;
