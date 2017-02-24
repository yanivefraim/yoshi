'use strict';

module.exports = () => ({
  test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)(\?.*)?$/,
  loader: 'url-loader',
  query: {
    name: '[path][name].[ext]?[hash]',
    limit: 10000
  }
});
