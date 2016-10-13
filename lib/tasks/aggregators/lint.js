'use strict';
const utils = require('../../utils');

module.exports = (gulp, plugins, options) => {
  require('../stylelint')(gulp, plugins, options);

  let linterTask = utils.isTypescriptProject() ?
    makeTslintTask :
    makeEslintTask;

  const lintTasks = [linterTask(gulp, plugins, options)];

  if (options.client) {
    lintTasks.push('stylelint');
  }

  gulp.task('lint', lintTasks);
};

function makeTslintTask(gulp, plugins, options) {
  require('../tslint')(gulp, plugins, options);

  return 'tslint';
}

function makeEslintTask(gulp, plugins, options) {
  require('../eslint')(gulp, plugins, options);

  return 'eslint';
}

