'use strict';

const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
const ld = require('lodash');
const projectConfig = require('../../config/project');
const globs = require('../globs');

module.exports = (gulp, plugins) => {

  gulp.task('bundle:specs', () => {
    plugins.util.log('Bundling specs with Webpack');

    const webpackConfig = getWebpackConfig('../../config/webpack.config.specs', getSpecsIO(globs.specs()));
    return runWebpack(webpackConfig);
  });

  function getSpecsIO(defaultGlob) {
    const specsGlobs = projectConfig.specs.browser() || defaultGlob;
    const entry = [];
    glob.sync(specsGlobs).forEach(filepath => {
      entry.push(path.resolve(filepath));
    });
    return {entry};
  }

  function getWebpackConfig(configPath, io) {
    return ld.merge(require(configPath), io);
  }

  function runWebpack(config) {
    const compiler = webpack(config);

    // Hack to remove extract-text-webpack-plugin messages
    // https://github.com/webpack/extract-text-webpack-plugin/issues/35
    compiler.plugin('done', stats => {
      const messages = stats.stats || [];
      messages.forEach(stat => {
        stat.compilation.children = stat.compilation.children.filter(child =>
          child.name !== 'extract-text-webpack-plugin');
      });
    });

    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        const message = (err && err.toString()) || (stats.toString({
          colors: true,
          hash: false,
          chunks: false,
          assets: false,
          children: false
        }));
        plugins.util.log(message);
        if (err || stats.hasErrors()) {
          reject(message);
        } else {
          resolve(message);
        }
      });
    });
  }
};
