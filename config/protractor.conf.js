'use strict';

require('babel-register');
require('ts-node/register');
const path = require('path');
const ld = require('lodash');
const exists = require('../lib/utils').exists;
const inTeamCity = require('../lib/utils').inTeamCity;
const serverApi = require('../lib/server-api');
const projectConfig = require('./project');
const globs = require('../lib/globs');

const userConfPath = path.resolve('protractor.conf.js');
const userConf = exists(userConfPath) ? require(userConfPath).config : null;
const onPrepare = (userConf && userConf.onPrepare) || ld.noop;
const onComplete = (userConf && userConf.onComplete) || ld.noop;
let cdnServer;

function clientFilesPath() {
  const clientProjectName = projectConfig.clientProjectName();

  return clientProjectName ?
    `node_modules/${clientProjectName}/${globs.multipleModules.clientDist()}` :
    globs.singleModule.clientDist();
}

const merged = ld.mergeWith({
  framework: 'jasmine',
  specs: [globs.e2e()],
  onPrepare: () => {
    require('babel-register');

    if (merged.framework === 'jasmine' && inTeamCity()) {
      const TeamCityReporter = require('jasmine-reporters').TeamCityReporter;
      jasmine.getEnv().addReporter(new TeamCityReporter());
    }

    const port = projectConfig.servers.cdn.port() || 3200;
    serverApi.start({port, filesPath: clientFilesPath()}).then(server => {
      cdnServer = server;
    });
    onPrepare.call(merged);
  },
  onComplete: () => {
    if (cdnServer) {
      cdnServer.close();
    }
    onComplete(merged);
  }
}, userConf, a => typeof a === 'function' ? a : undefined);

if (merged.framework === 'mocha') {
  merged.mochaOpts = merged.mochaOpts || {};
  merged.mochaOpts.reporter = 'mocha-env-reporter';
}

if (!inTeamCity()) {
  merged.chromeDriver = require.resolve('chromedriver/bin/chromedriver');
}

function normaliseSpecs(config) {
  let specs = [].concat(config.specs || []);
  return Object.assign({}, config, {specs: specs.map(spec => path.resolve(spec))});
}

module.exports.config = normaliseSpecs(merged);
