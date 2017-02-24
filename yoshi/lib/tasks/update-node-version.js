'use strict';

const nodeManager = require('../node-manager');
const {inTeamCity} = require('../utils');

function updateNodeVersion() {
  if (!inTeamCity()) {
    nodeManager.updateVersion();
  }

  return Promise.resolve();
}

module.exports = updateNodeVersion;
