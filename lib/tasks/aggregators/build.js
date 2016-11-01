'use strict';

const runSequence = require('run-sequence');
const {isTypescriptProject, handleRunSequenceErrors, isBabelProject} = require('../../utils');

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
    'sass',
    'createMavenTarGz',
    'copy-assets'
  ];

  if (isTypescriptProject()) {
    buildTasks.push('typescript');
  } else if (isBabelProject()) {
    buildTasks.push('babel');
  }

  gulp.task('build', cb => runSequence(prebuildTasks, buildTasks, handleRunSequenceErrors(cb)));
};
