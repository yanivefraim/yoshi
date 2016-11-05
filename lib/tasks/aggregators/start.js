'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const gutil = require('gulp-util');
const express = require('express');
const {spawn} = require('child_process');
const webpackMiddleware = require('webpack-dev-middleware');
const runSequence = require('run-sequence');
const utils = require('../../utils');
const projectConfig = require('../../../config/project');
const {compiler} = require('../webpack');

module.exports = (gulp, plugins, options) => {
  let server;

  const port = projectConfig.servers.cdn.port();
  const clientFilesPath = projectConfig.clientFilesPath();
  const bundler = compiler({debug: true, hot: options.hot});

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

    server = spawn('node', [path.resolve(options.entryPoint)], {env});
    [server.stdout, server.stderr].forEach(stream =>
      stream.on('data', writeToServerLog)
    );

    const displayErrors = _.debounce(() => {
      gutil.log(
        gutil.colors.red('There are errors! Please check'),
        gutil.colors.magenta('./target/server.log')
      );
    }, 500);

    server.stderr.on('data', buffer => {
      if (buffer.toString().includes('wix:error')) {
        displayErrors();
      }
    });

    return server;
  };

  // TODO: change gulp tasks to simple async functions
  options = Object.assign(options, {
    done: options.server ? runServer : function () {},
    watch: true
  });

  require('../node')(gulp, plugins, options);
  require('../babel')(gulp, plugins, options);
  require('../typescript')(gulp, plugins, options);
  require('../sass')(gulp, plugins, options);
  require('../mocha')(gulp, plugins, options);
  require('../copy-assets')(gulp, plugins, options);
  require('../clean')(gulp, plugins, options);

  runSequence('clean:all', () => {
    gulp.start(utils.isTypescriptProject() ? 'typescript' : 'babel');

    gulp.start('update-node-version');
    gulp.start('sass');
    gulp.start('copy-assets');

    if (!options.server) {
      gulp.start('mocha');
    }
  });

  const app = express()
    .use(getCorsMiddleware());

  if (bundler) {
    app.use(getWebpackDevMiddleware(bundler));
    if (options.hot) {
      app.use(require('webpack-hot-middleware')(bundler));
    }
  }

  app.use(express.static(clientFilesPath))
    .listen(port, 'localhost');
};

function getCorsMiddleware() {
  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');

    next();
  };
}

function getWebpackDevMiddleware(bundler) {
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
