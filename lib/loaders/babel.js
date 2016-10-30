'use strict';

module.exports = isAngularProject => ({
  test: /\.js$/,
  exclude: /(node_modules)/,
  loaders: [...isAngularProject ? ['ng-annotate'] : [], 'babel-loader']
});
