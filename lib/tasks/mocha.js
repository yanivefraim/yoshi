'use strict';

const {watchMode} = require('../utils');
const projectConfig = require('../../config/project');
const globs = require('../globs');
const inTeamCity = require('../utils').inTeamCity;
const path = require('path');

module.exports = (gulp, plugins) => {
  gulp.task('mocha', watchMode() ? ['mocha:watch'] : ['_mocha']);

  gulp.task('mocha:watch', ['_mocha'], () => {
    gulp.watch(`${globs.base()}/**/*`, ['_mocha']);
  });

  gulp.task('_mocha', () => {
    plugins.util.log('Testing with Mocha');

    const mochaGlobs = projectConfig.specs.node() || globs.specs();

    return gulp.src(mochaGlobs, {read: false})
      .pipe(plugins.spawnMocha({
        env: {NODE_ENV: 'test', SRC_PATH: './src'},
        reporter: inTeamCity() ? 'mocha-teamcity-reporter' : 'progress',
        timeout: 30000,
        require: [
          path.join(__dirname, '..', 'require-hooks'),
          path.join(__dirname, '..', 'setup', 'mocha-setup')
        ]
      }))
      .on('error', handleErrors);

    function handleErrors(err) {
      // gulp-spawn-mocha does not emits error on AssertionError, but just display them
      // if there's an AssertionError, it emits an error at the end of the stream
      if (!watchMode()) {
        throw err;
      }

      this.emit('end');
    }
  });
};
