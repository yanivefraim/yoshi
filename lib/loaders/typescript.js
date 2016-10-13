'use strict';

module.exports = () => ({
  test: /\.tsx?$/,
  exclude: /(node_modules)/,
  loader: 'ts'
});
