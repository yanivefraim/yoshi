'use strict';

const {unprocessedModules} = require('../../config/project');

require('babel-register')({
  only: unprocessedModules()
});
