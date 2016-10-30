'use strict';

const nodeManager = require('../node-manager');
const {inTeamCity} = require('../utils');

module.exports = gulp =>
  gulp.task('update-node-version', () => {
    if (!inTeamCity()) {
      nodeManager.updateVersion();
    }
  });
