'use strict';

const globs = require('../globs');
const {noop, normalizeGlobDirList} = require('../utils');
const path = require('path');
const mkdirp = require('mkdirp');

module.exports = (gulp, plugins, {dirs, watch = false, done = noop} = {}) => {
  const files = typeof dirs === 'string' ?
    globs.babel(normalizeGlobDirList(dirs)) :
    globs.babel();

  gulp.task('babel', watch ? ['babel:watch'] : ['_babel']);

  gulp.task('babel:watch', ['_babel'], () => {
    gulp.watch(files, ['_babel']);
  });

  gulp.task('_babel', () => {
    plugins.util.log('Compiling with Babel');

    let hasError = false;

    mkdirp(path.resolve('target'));

    return new Promise((resolve, reject) => {
      gulp.src(files, {base: '.'})
        .pipe(plugins.plumber(handleErrors))
        .pipe(plugins.fileTransformCache({
          path: path.resolve('target', '.babel-cache'),
          transformStreams: [plugins.sourcemaps.init(), plugins.babel()]
        }))
        .pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest('dist'))
        .once('end', () => onEnd(resolve, reject));
    }).then(done);

    function onEnd(onSuccess, onFailure) {
      if (hasError) {
        // we have to pass a non empty string in order
        // to reject properly, see: https://github.com/gulpjs/gulp/issues/1327
        onFailure('dummy-must-have-string');

        if (!watch) {
          throw new plugins.util.PluginError('WixBabelTask', {
            message: 'Something broke in build process, see above for further details'
          });
        }
      } else {
        onSuccess();
      }
    }

    function handleErrors(err) {
      // gulp-babel emits error on every compilation error,
      // so we have to print these errors manually

      // nice workaround (?) to have a full and detailed compilation errors
      // we use it to resolve or reject the returned promise
      hasError = true;
      plugins.util.log(plugins.util.colors.red(err.message));

      if (err.plugin === 'gulp-babel') {
        // already styled error
        console.log(err.codeFrame);
      }
    }
  });
};
