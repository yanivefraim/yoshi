'use strict';

const path = require('path');
const express = require('express');
const gutil = require('gulp-util');

function start(options) {
  const app = new express();
  const files = path.resolve(options.filesPath);

  app.use('*', (req, res, next) => {
    //Cross-Origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');

    next();
  });


  app.use(express.static(files));
  return new Promise((resolve, reject) => {
    const server = app.listen(options.port, err => {
      if (!err) {
        gutil.log(`CDN server is up and running on port ${options.port}`);
        gutil.log(`Static files are being served from ${files}`);
        resolve(server);
      } else {
        reject(err);
      }
    });
  });
}

module.exports = {
  start
};
