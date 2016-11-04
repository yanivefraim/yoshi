'use strict';

module.exports = isAngularProject => ({
  test: /\.tsx?$/,
  exclude: /(node_modules)/,
  loaders: [...isAngularProject ? ['ng-annotate'] : [], 'ts'],
  query: {
      logInfoToStdOut: true
 }
});
