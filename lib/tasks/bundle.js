'use strict';

const _ = require('lodash/fp');
const webpack = require('webpack');
const wpConfig = require('../../config/webpack.config.specs');
const {watchMode} = require('../utils');

module.exports = (gulp, plugins) => {
  gulp.task('bundle:specs', done => {
    plugins.util.log('Bundling specs with Webpack');

    const compiler = webpack(wpConfig);
    const callback = _.compose(_.once(done), printErrors);

    if (watchMode()) {
      compiler.watch({}, callback);
    } else {
      compiler.run(callback);
    }
  });

  function printErrors(err, stats) {
    const message = err ?
      err.toString() :
      stats.toString({
        colors: true,
        hash: false,
        chunks: false,
        assets: false,
        children: false
      });

    plugins.util.log(message);

    if (err || stats.hasErrors()) {
      return message;
    }
  }
};
