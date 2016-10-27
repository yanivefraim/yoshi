'use strict';

const del = require('del');

module.exports = (gulp, plugins) => {
  gulp.task('clean:dist', () => {
    plugins.util.log('Cleaning up \'dist\'...');
    return del(['dist']);
  });
};
