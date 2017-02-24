'use strict';

const webpack = require('webpack');
const getConfig = require('../../config/webpack.config.client');
const {shouldRunWebpack, filterNoise} = require('../utils');

function runBundle(webpackOptions) {
  return function bundle() {
    const webpackConfig = getConfig(webpackOptions);

    if (!shouldRunWebpack(webpackConfig)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      filterNoise(webpack(webpackConfig)).run((err, stats) => {
        if (err || stats.hasErrors()) {
          return reject(err);
        }

        return resolve();
      });
    });
  };
}

module.exports = runBundle;
