'use strict';

const runSequence = require('run-sequence');
const {isTypescriptProject, handleRunSequenceErrors} = require('../../utils');

module.exports = (gulp, plugins, options) => {
  require('../targz')(gulp);
  require('../copy-assets')(gulp, plugins, options);
  require('../sass')(gulp, plugins, options);
  require('../typescript')(gulp, plugins, options);
  require('../babel')(gulp, plugins, options);
  require('../clean')(gulp, plugins, options);
  require('../node')(gulp);

  const prebuildTasks = [
    'clean:all',
    'update-node-version'
  ];

  const buildTasks = [
    'babel',
    'sass',
    'createMavenTarGz',
    'copy-assets',
    ...isTypescriptProject() ? ['typescript'] : []
  ];

  gulp.task('build', cb => runSequence(prebuildTasks, buildTasks, handleRunSequenceErrors(cb)));
};
