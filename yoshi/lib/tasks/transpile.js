'use strict';

const babel = require('./babel');
const typescript = require('./typescript');
const noTranspile = require('./no-transpile');
const {runIndividualTranspiler} = require('../../config/project');
const {isTypescriptProject, isBabelProject} = require('../utils');

function transpile(...args) {
  if (isTypescriptProject() && runIndividualTranspiler()) {
    return typescript(...args);
  }

  if (isBabelProject() && runIndividualTranspiler()) {
    return babel(...args);
  }

  return noTranspile(...args);
}

module.exports = transpile;
