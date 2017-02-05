'use strict';

const {isTypescriptProject} = require('../../utils');
const run = require('../../run');
const stylelint = require('../stylelint');
const eslint = require('../eslint');
const tslint = require('../tslint');

const linter = isTypescriptProject() ? tslint : eslint;

function lint(options) {
  const tasks = [
    linter,
    ...options.client ? [stylelint] : []
  ];

  return run(options)(...tasks);
}

module.exports = lint;

