'use strict';

const {unprocessedModules} = require('../../config/project');

module.exports = isAngularProject => ({
  test: /\.js$/,
  include: unprocessedModules(),
  loaders: [...isAngularProject ? ['ng-annotate'] : [], 'babel-loader']
});
