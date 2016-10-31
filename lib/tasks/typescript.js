'use strict';

const typescript = require('typescript');
const {normalizeGlobDirList, noop} = require('../utils');
const globs = require('../globs');

module.exports = (gulp, plugins, {dirs, watch = false, done = noop} = {}) => {
  const files = typeof dirs === 'string' ?
    globs.typescript(normalizeGlobDirList(dirs)) :
    globs.typescript();

  gulp.task('typescript', watch ? ['typescript:watch'] : ['_typescript']);

  gulp.task('typescript:watch', ['_typescript'], () => {
    gulp.watch(files, ['_typescript']);
  });

  return gulp.task('_typescript', () => {
    plugins.util.log('Compiling TypeScript @', typescript.version);

    const tsProject = plugins.typescript.createProject('tsconfig.json');
    let hasError = false;

    return new Promise((resolve, reject) =>
      gulp.src(files, {base: '.'})
        .pipe(plugins.plumber(handleErrors))
        .pipe(plugins.sourcemaps.init())
        .pipe(tsProject())
        .pipe(plugins.sourcemaps.write('.'))
        .pipe(gulp.dest('dist/'))
        .once('finish', () => onFinish(resolve, reject))
    ).then(done);

    function onFinish(onSuccess, onFailure) {
      if (hasError) {
        // we have to pass a non empty string in order
        // to reject properly, see: https://github.com/gulpjs/gulp/issues/1327
        onFailure('dummy-must-have-string');

        if (!watch) {
          throw new plugins.util.PluginError('WixTypeScriptTask', {
            message: 'Something broke in build process, see above for further details'
          });
        }
      } else {
        onSuccess();
      }
    }

    function handleErrors(err) {
      // nice workaround (?) to have a full and detailed compilation errors
      // we use it to resolve or reject the returned promise
      hasError = true;
      // the way we detect typescript error, it handles errors in his own
      // so we should not print them
      if (!err.tsFile) {
        console.log(err.message);
      }
    }
  });
};
