'use strict';

const {isTypescriptProject, isBabelProject, exists, isNoServerTranspile} = require('../utils');
const projectConfig = require('../../config/project');
const globs = require('../globs');
const inTeamCity = require('../utils').inTeamCity;
const path = require('path');

module.exports = (gulp, plugins, {watch}) => {
  gulp.task('mocha', watch ? ['mocha:watch'] : ['_mocha']);

  gulp.task('mocha:watch', ['_mocha'], () => {
    gulp.watch(`${globs.base()}/**/*`, ['_mocha']);
  });

  gulp.task('_mocha', () => {
    plugins.util.log('Testing with Mocha');

    const mochaGlobs = projectConfig.specs.node() || globs.specs();
    const fileExt = isTypescriptProject() ? 'ts' : 'js';
    const mochSetupPath = path.resolve(path.join('test', `mocha-setup.${fileExt}`));

    return gulp.src(mochaGlobs, {read: false})
      .pipe(plugins.spawnMocha({
        env: {NODE_ENV: 'test', SRC_PATH: './src'},
        reporter: inTeamCity() ? 'mocha-teamcity-reporter' : 'progress',
        timeout: 30000,
        require: [
          ...getTranspileTask(),
          path.join(__dirname, '..', 'ignore-extensions'),
          ...exists(mochSetupPath) ? [mochSetupPath] : []
        ]
      }))
      .on('error', handleErrors);

    function handleErrors(err) {
      // gulp-spawn-mocha does not emits error on AssertionError, but just display them
      // if there's an AssertionError, it emits an error at the end of the stream
      if (!watch) {
        throw err;
      }

      this.emit('end');
    }

    // Todo: refactor
    function getTranspileTask() {
      const noServerTranspile = isNoServerTranspile();
      if (isTypescriptProject() && !noServerTranspile) {
        return ['ts-node/register'];
      } else if (isBabelProject() && !noServerTranspile) {
        return ['babel-register'];
      }
      return [];
    }
  });
};
