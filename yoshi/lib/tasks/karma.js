'use strict';

const _ = require('lodash/fp');
const path = require('path');
const {Server} = require('karma');
const webpack = require('webpack');
const {watchMode} = require('../utils');
const wpConfig = require('../../config/webpack.config.specs');

const watch = watchMode();

function printStats(stats) {
  console.log(stats.toString({
    colors: true,
    hash: false,
    chunks: false,
    assets: false,
    children: false
  }));
}

function bundle() {
  return new Promise((resolve, reject) => {
    const compiler = webpack(wpConfig);

    const callback = (err, stats) => {
      printStats(stats);

      if (err || stats.hasErrors()) {
        return reject();
      }

      return resolve();
    };

    if (watch) {
      compiler.watch({}, callback);
    } else {
      compiler.run(callback);
    }
  });
}

function karma() {
  const karmaConfig = {
    configFile: path.join(__dirname, '..', '..', 'config/karma.conf'),
    singleRun: !watch,
    autoWatch: watch
  };

  return bundle().then(() => {
    return new Promise((resolve, reject) => {
      const server = new Server(karmaConfig, code => {
        if (code === 0) {
          resolve();
        } else {
          reject();
        }

        if (watch) {
          process.exit(code);
        }
      });

      server.start();
    });
  });
}

module.exports = karma;
