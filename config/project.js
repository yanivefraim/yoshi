'use strict';

const path = require('path');
const _ = require('lodash');
const packagejson = require(path.resolve('package.json'));
const globs = require('../lib/globs');

const config = packagejson.wix || {};
const isSingleEntry = entry => typeof entry === 'string' || Array.isArray(entry);

module.exports = {
  specs: {
    node: () => getConfig('specs.node'),
    browser: () => getConfig('specs.browser')
  },
  clientProjectName: () => getConfig('clientProjectName'),
  clientFilesPath: () => {
    const clientProjectName = getConfig('clientProjectName');
    const dir = getConfig('servers.cdn.dir');
    return clientProjectName ?
      `node_modules/${clientProjectName}/${dir || globs.multipleModules.clientDist()}` :
      (dir || globs.singleModule.clientDist());
  },
  isUniversalProject: () => getConfig('universalProject'),
  isAngularProject: () => !!_.get(packagejson, 'dependencies.angular', false),
  servers: {
    cdn: {
      port: () => getConfig('servers.cdn.port', 3200)
    }
  },
  bundleEntry: () => {
    const entry = getConfig('entry', {app: './client'});
    return isSingleEntry(entry) ? {app: entry} : entry;
  },
  separateCss: () => getConfig('separateCss', true),
  cssModules: () => getConfig('cssModules', true),
  externals: () => getConfig('externals'),
  babel: () => _.get(packagejson, 'babel'),
  getPathAliases: () => getConfig('pathAliases', {})
};

function getConfig(key, defaultVal = false) {
  return _.get(config, key, defaultVal);
}
