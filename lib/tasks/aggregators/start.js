'use strict';

const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const gutil = require('gulp-util');
const express = require('express');
const {spawn} = require('child_process');
const webpackMiddleware = require('webpack-dev-middleware');
const utils = require('./../../utils');
const projectConfig = require('./../../../config/project');
const {compiler} = require('./../webpack');

module.exports = (options, loadTasks) => {
  let server;

  const port = projectConfig.servers.cdn.port();
  const clientFilesPath = projectConfig.clientFilesPath();
  const bundler = compiler({debug: true});

  const runServer = () => {
    const env = Object.create(process.env);
    if (server) {
      server.kill('SIGTERM');
    } else {
      console.log('');
      gutil.log('Application is now available at ', gutil.colors.magenta(`http://localhost:3000${env.MOUNT_POINT || '/'}`));
      gutil.log('Server log is written to ', gutil.colors.magenta('./target/server.log'));
      gulp.start('mocha');
    }

    env.NODE_ENV = 'development';
    env.DEBUG = 'wix:*,wnp:*';

    //const file = path.resolve(entryPoint);
    // const args = ['--inspect=9223', '--debug-brk', file];
    // server = spawn('node', args, {env});
    server = spawn('node', [path.resolve(options.entryPoint)], {env});
    [server.stdout, server.stderr].forEach(stream =>
      stream.on('data', writeToServerLog)
    );

    return server;
  };

  // TODO: change gulp tasks to simple async functions
  loadTasks({
    done: options.server ? runServer : function () {},
    watch: true
  });

  utils.isTypescriptProject() ?
    gulp.start('typescript') :
    gulp.start('babel');

  gulp.start('sass');
  gulp.start('copy-assets');

  if (!options.server) {
    gulp.start('mocha');
  }

  express()
    .use(getCorsMiddleware())
    .use(getWebpackMiddleware(bundler))
    .use(express.static(clientFilesPath))
    .listen(port, 'localhost');
};

function getCorsMiddleware() {
  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');

    next();
  };
}

function getWebpackMiddleware(bundler) {
  try {
    return webpackMiddleware(bundler, {
      noInfo: true,
      stats: {
        colors: true
      }
    });
  } catch (e) {
    return (req, res, next) => next();
  }
}

function writeToServerLog(data) {
  fs.appendFile('target/server.log', data);
}
