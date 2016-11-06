'use strict';

const globs = require('../globs');
const {noop, normalizeGlobDirList} = require('../utils');

module.exports = (gulp, plugins, {dirs, watch = false, done = noop} = {}) => {
  const files = typeof dirs === 'string' ?
    globs.babel(normalizeGlobDirList(dirs)) :
    globs.babel();

  gulp.task('no-transpile', watch ? ['no-transpile:watch'] : ['_no-transpile']);

  gulp.task('no-transpile:watch', ['_no-transpile'], () => {
    console.log('Watching', files);
    gulp.watch(files, ['_notranspile']);
  });

  gulp.task('_no-transpile', () => {
    console.log('Restarting Server...');
    return Promise.resolve().then(done);
  });
};
