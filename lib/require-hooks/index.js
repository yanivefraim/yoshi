'use strict';

const {isTypescriptProject, isBabelProject} = require('../utils');

runtimeTranspiler();

function runtimeTranspiler() {
  if (isTypescriptProject()) {
    require('./ts-node-register');
  } else if (isBabelProject()) {
    require('./babel-register');
  }
}
