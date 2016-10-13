'use strict';

const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  extract: filename => new ExtractTextPlugin(filename || 'app.css'),
};
