'use strict';

const fs = require('fs');
const path = require('path');
const gutil = require('gulp-util');
const {spawn} = require('child_process');
const gulp = require('gulp');

let server;
const runServer = options => {
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
    stream.on('data', data => fs.appendFile('target/server.log', data))
  );

  return server;
};

module.exports = runServer;
