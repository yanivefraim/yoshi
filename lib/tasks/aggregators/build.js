'use strict';

const runSequence = require('run-sequence');
const {isTypescriptProject, handleRunSequenceErrors} = require('../../utils');

module.exports = (gulp, plugins, options) => {
  require('../targz')(gulp);
  require('../copy-assets')(gulp, plugins, options);
  require('../sass')(gulp, plugins, options);
  require('../typescript')(gulp, plugins, options);
  require('../babel')(gulp, plugins, options);

  let buildTasks = [[
    'babel',
    'createMavenTarGz',
    'copy-assets',
    ...isTypescriptProject() ? ['typescript'] : []
  ]];

  gulp.task('build', cb => runSequence(...[...buildTasks, handleRunSequenceErrors(cb)]));
};
