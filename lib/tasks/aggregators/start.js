'use strict';

const {spawn} = require('child_process');
const run = require('../../run');
const clean = require('../clean');
const sass = require('../sass');
const transpile = require('../transpile');
const updateNodeVersion = require('../node');
const petri = require('../petri');
const targz = require('../targz');
const webpackDevServer = require('../webpack-dev-server');
const copyAssets = require('../copy-assets');
const runServer = require('../run-server');

function start(options) {
  const runWithOptions = run(options);
  const restartServer = () => options.server && runServer({entryPoint: options.entryPoint});

  return runWithOptions(clean, updateNodeVersion)
    .then(() => runWithOptions(sass, petri, targz, copyAssets, webpackDevServer, transpile(restartServer)))
    .then(() => spawn('npm', ['test', '--silent'], {stdio: 'inherit'}));
}

module.exports = start;
