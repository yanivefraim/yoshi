'use strict';

const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const getConfig = require('../../config/webpack.config.client');
const {servers} = require('../../config/project');
const {shouldRunWebpack, filterNoise} = require('../utils');
const {start} = require('../server-api');

function webpackDevServer() {
  const webpackConfig = getConfig({debug: true});

  let middlewares = [];

  if (shouldRunWebpack(webpackConfig)) {
    webpackConfig.entry = addHotEntries(webpackConfig.entry);
    webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
    webpackConfig.output.publicPath = `http://localhost:${servers.cdn.port()}/`;

    const bundler = filterNoise(webpack(webpackConfig));

    middlewares = [
      webpackDevMiddleware(bundler, {quiet: true}),
      webpackHotMiddleware(bundler)
    ];
  }

  return start({middlewares});
}

function addHotEntries(entries) {
  return Object.keys(entries).reduce((acc, value) => {
    acc[value] = [
      `${require.resolve('webpack-hot-middleware/client')}?dynamicPublicPath=true&path=__webpack_hmr`
    ].concat(entries[value]);
    return acc;
  }, {});
}

module.exports = webpackDevServer;
