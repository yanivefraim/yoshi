'use strict';

const projectConfig = require('../../config/project');
const globs = require('../globs');
const inTeamCity = require('../utils').inTeamCity;

module.exports = (gulp, plugins, options) =>
  gulp.task('jasmine', () => {
    plugins.util.log('Testing with Jasmine');

    process.env.NODE_ENV = 'test';
    process.env.SRC_PATH = './src';

    const jasmineGlobs = projectConfig.specs.node() || globs.specs();
    const settings = {/*includeStackTrace: true, */errorOnFail: true};

    if (inTeamCity()) {
      const TeamCityReporter = require('jasmine-reporters').TeamCityReporter;
      settings.reporter = new TeamCityReporter();
    }

    return gulp.src(jasmineGlobs)
      .pipe(plugins.jasmine(settings))
      .on('error', handleErrors)
    ;

    function handleErrors() {
      // gulp-jasmine does not emits error on AssertionError, but just display them
      // if there's an AssertionError, it emits an error at the end of the stream
      if (!options.watch) {
        throw new plugins.util.PluginError('WixJasmineTask', {
          message: 'Something broke in build process, see above for further details'
        });
      } else {
        this.emit('end');
      }
    }
  });
