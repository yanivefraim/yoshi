'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const gutil = require('gulp-util');
const {spawn} = require('child_process');
const mkdirp = require('mkdirp');
const detect = require('detect-port');

let server;
let port;

const defaultPort = Number(process.env.PORT) || 3000;

function writeToServerLog(data) {
  fs.appendFile('target/server.log', data);
}

const runServer = ({entryPoint}) => {
  const serverScript = path.resolve(entryPoint);
  if (!fs.existsSync(serverScript)) {
    mkdirp.sync(path.resolve('target'));
    writeToServerLog('no server');
    return Promise.resolve();
  }

  port = port || detect(defaultPort);

  return port.then(newPort => {
    const env = Object.assign({}, process.env, {
      NODE_ENV: 'development',
      DEBUG: 'wix:*,wnp:*',
      PORT: newPort
    });

    if (server) {
      server.kill('SIGTERM');
    } else {
      if (newPort !== defaultPort) {
        gutil.log(gutil.colors.green(
          `There's something running on port ${defaultPort}, using ${newPort} instead.`
        ));
      }

      console.log('');
      gutil.log('Application is now available at ', gutil.colors.magenta(`http://localhost:${env.PORT}${env.MOUNT_POINT || '/'}`));
      gutil.log('Server log is written to ', gutil.colors.magenta('./target/server.log'));
    }

    mkdirp.sync(path.resolve('target'));
    server = spawn('node', [serverScript], {env});
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
  });
};

module.exports = runServer;
