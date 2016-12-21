'use strict';

const express = require('express');
const projectConfig = require('../config/project');

function corsMiddleware() {
  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  };
}

function start({middlewares = [], host}) {
  const port = projectConfig.servers.cdn.port();
  const files = projectConfig.clientFilesPath();
  const app = express();

  [corsMiddleware(), express.static(files), ...middlewares]
    .forEach(mw => app.use(mw));

  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, err =>
      err ? reject(err) : resolve(server));
  });
}

module.exports = {start};
