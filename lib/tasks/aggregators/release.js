'use strict';

const run = require('../run');
const wnpmRelease = require('../wnpm-release');

function release(options) {
  return run(options)(wnpmRelease);
}

module.exports = release;
