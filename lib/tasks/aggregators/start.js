'use strict';

const gulp = require('gulp');
const utils = require('../../utils');
const startWebpack = require('../webpack').start;
const runServer = require('../run-server');

module.exports = (options, loadTasks) => {
  loadTasks({
    done: options.server ? runServer : function () {},
    watch: true
  });

  gulp.start(utils.isTypescriptProject() ? 'typescript' : 'babel');

  gulp.start('sass');
  gulp.start('copy-assets');

  if (!options.server) {
    gulp.start('mocha');
  }

  startWebpack();
};
