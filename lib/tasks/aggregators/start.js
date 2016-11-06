'use strict';

const runSequence = require('run-sequence');
const {isTypescriptProject} = require('../../utils');

module.exports = (gulp, plugins, options) => {
  require('../mocha')(gulp, plugins, options);
  require('../copy-assets')(gulp, plugins, options);
  require('../sass')(gulp, plugins, options);
  require('../typescript')(gulp, plugins, options);
  require('../babel')(gulp, plugins, options);
  require('../clean')(gulp, plugins, options);
  require('../node')(gulp, plugins, options);

  const prebuildTasks = [
    'clean:all',
    'update-node-version'
  ];

  const buildTasks = [
    'sass',
    'copy-assets',
    ...getTranspileTask(),
    ...options.server ? [] : ['mocha']
  ];

  gulp.task('start', () => runSequence(prebuildTasks, buildTasks));
};

function getTranspileTask() {
  if (isTypescriptProject()) {
    return ['typescript'];
  } else {
    return ['babel'];
  }
}
