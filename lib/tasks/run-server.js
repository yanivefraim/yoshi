'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const gutil = require('gulp-util');
const {spawn} = require('child_process');
const mkdirp = require('mkdirp');

let server;

function writeToServerLog(data) {
  fs.appendFile('target/server.log', data);
}

const runServer = (gulp, {entryPoint}) => {
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

  mkdirp.sync(path.resolve('target'));
  server = spawn('node', [path.resolve(entryPoint)], {env});
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

module.exports = runServer;
