'use strict';

const del = require('del');

module.exports = (gulp, plugins) => {
  const clean = folderName => () => {
    plugins.util.log(`Cleaning up '${folderName}'...`);
    return del([folderName]);
  };

  gulp.task('clean:dist', clean('dist'));
  gulp.task('clean:target', clean('target'));
  gulp.task('clean:all', ['clean:dist', 'clean:target']);
};
