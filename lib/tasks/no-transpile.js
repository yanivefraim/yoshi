'use strict';

const globs = require('../globs');
const {noop, normalizeGlobDirList, watchMode} = require('../utils');

module.exports = (gulp, plugins, {dirs, done = noop} = {}) => {
  const files = typeof dirs === 'string' ?
    globs.babel(normalizeGlobDirList(dirs)) :
    globs.babel();

  gulp.task('no-transpile', watchMode() ? ['no-transpile:watch'] : ['_no-transpile']);

  gulp.task('no-transpile:watch', ['_no-transpile'], () => {
    gulp.watch(files, ['_no-transpile']);
  });

  gulp.task('_no-transpile', () => Promise.resolve().then(done));
};
