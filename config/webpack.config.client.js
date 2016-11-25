'use strict';

const _ = require('lodash');
const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');
const {mergeByConcat, isSingleEntry} = require('../lib/utils');
const webpackConfigCommon = require('./webpack.config.common');
const projectConfig = require('./project');
const DynamicPublicPath = require('../lib/plugins/dynamic-public-path');

const config = ({debug, hot, separateCss = projectConfig.separateCss()} = {}) => {
  const entry = bundleEntry();
  const cssModules = projectConfig.cssModules();
  const extractCSS = getExtractCss();

  return mergeByConcat(webpackConfigCommon, {
    entry: hot ? addHotEntries(entry) : entry,

    module: {
      loaders: [
        require('../lib/loaders/sass')(extractCSS, cssModules).client
      ]
    },

    plugins: [
      ...hot ? [new webpack.HotModuleReplacementPlugin()] : [],

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

    output: {
      path: path.resolve('./dist/statics'),
      filename: debug ? '[name].bundle.js' : '[name].bundle.min.js',
      publicPath: hot ? `http://localhost:${projectConfig.servers.cdn.port()}/` : undefined
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

function bundleEntry() {
  const entry = projectConfig.entry() || projectConfig.defaultEntry();
  return isSingleEntry(entry) ? {app: entry} : entry;
}

module.exports = config;
