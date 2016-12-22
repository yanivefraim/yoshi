'use strict';
const {tryRequire} = require('../lib/utils');


//Private wix applitools key
//skip wix' key for applitools
//In case you want to use applitools & eyes.it (https://github.com/wix/eyes.it)
//in your project, please use your own key
tryRequire('wix-eyes-env');

// Private Wix environment config for screenshot reporter
// Read how to set your own params (if needed) here: https://github.com/wix/screenshot-reporter#usage
try {
  require('screenshot-reporter-env');
} catch (e) {}


require('../lib/require-hooks');
const path = require('path');
const ld = require('lodash');
const exists = require('../lib/utils').exists;
const inTeamCity = require('../lib/utils').inTeamCity;
const {start} = require('../lib/server-api');
const globs = require('../lib/globs');

const userConfPath = path.resolve('protractor.conf.js');
const userConf = exists(userConfPath) ? require(userConfPath).config : null;
const onPrepare = (userConf && userConf.onPrepare) || ld.noop;
const onComplete = (userConf && userConf.onComplete) || ld.noop;
let cdnServer;

const merged = ld.mergeWith({
  framework: 'jasmine',
  specs: [globs.e2e()],
  directConnect: true,
  onPrepare: () => {
    if (merged.framework === 'jasmine' && inTeamCity()) {
      const TeamCityReporter = require('jasmine-reporters').TeamCityReporter;
      jasmine.getEnv().addReporter(new TeamCityReporter());
    }

    try {
      const ScreenshotReporter = require('screenshot-reporter');
      jasmine.getEnv().addReporter(new ScreenshotReporter());
    } catch (e) {}

    return start({host: 'localhost'}).then(server => {
      cdnServer = server;
      return onPrepare.call(merged);
    });
  },
  onComplete: () => {
    if (cdnServer) {
      cdnServer.close();
    }
    onComplete(merged);
  },
  mochaOpts: {
    timeout: 30000
  }
}, userConf, a => typeof a === 'function' ? a : undefined);

if (merged.framework === 'mocha') {
  merged.mochaOpts.reporter = inTeamCity() ? 'mocha-teamcity-reporter' : 'mocha-env-reporter';
}

// TBD: remove this when CI support protractor 4. See commit https://github.com/wix/wix-node-build/commit/12dbae41543b4d8589b2268e0e1932e89bcd9d92
if (!merged.chromeDriver) {
  merged.chromeDriver = require.resolve('chromedriver/bin/chromedriver');
}

function normaliseSpecs(config) {
  const specs = [].concat(config.specs || []);
  return Object.assign({}, config, {specs: specs.map(spec => path.resolve(spec))});
}

module.exports.config = normaliseSpecs(merged);
