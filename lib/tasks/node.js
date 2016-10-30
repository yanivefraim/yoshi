'use strict';

const nodeManager = require('../node-manager');

module.exports = gulp =>
  gulp.task('update-node-version', nodeManager.updateVersion);
