'use strict';

const process = require('process');
const spawn = require('child_process').spawn;
const path = require('path');
const exists = require('./utils').exists;

const bin = 'protractor/bin';

function verifyWebdriver() {
  return new Promise(resolve => {
    const webdriver = spawn(
      require.resolve(`${bin}/webdriver-manager`),
      ['update', '--standalone'],
      {stdio: 'inherit'}
    );

    webdriver.once('close', resolve);
  });
}

function launch(options) {
  options = options || {};
  const args = Object.keys(options).map(option => `--${option}=${options[option]}`);
  const protractor = spawn(
    require.resolve(`${bin}/protractor`),
    [path.join(__dirname, '..', 'config', 'protractor.conf.js')].concat(args),
    {stdio: 'inherit', env: process.env}
  );

  return new Promise((resolve, reject) => {
    protractor.on('exit', code => code === 0 ? resolve(code) : reject(code));
  });
}

function run(options) {
  return verifyWebdriver().then(() => launch(options));
}

function hasConfFile() {
  return exists(path.resolve('protractor.conf.js'));
}

module.exports = {
  verifyWebdriver,
  launch,
  run,
  hasConfFile
};
