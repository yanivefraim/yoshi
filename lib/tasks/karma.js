'use strict';

const _ = require('lodash/fp');
const karma = require('karma');
const path = require('path');
const {watchMode} = require('../utils');

module.exports = (gulp, plugins) =>
  gulp.task('karma', () => {
    plugins.util.log('Testing with Karma');

    const watch = watchMode();

    const karmaConfig = {
      configFile: path.join(__dirname, '..', '..', 'config/karma.conf'),
      singleRun: !watch,
      autoWatch: watch
    };

    const server = new karma.Server(karmaConfig);
    server.start();
  });
