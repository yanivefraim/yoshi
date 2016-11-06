'use strict';

const {spawn} = require('child_process');
const runSequence = require('run-sequence');
const {isTypescriptProject, handleRunSequenceErrors, isBabelProject, isNoServerTranspile} = require('../../utils');

module.exports = (gulp, plugins, options) => {
  require('../targz')(gulp);
  require('../copy-assets')(gulp, plugins, options);
  require('../sass')(gulp, plugins, options);
  require('../typescript')(gulp, plugins, options);
  require('../babel')(gulp, plugins, options);
  require('../no-transpile')(gulp, plugins, options);
  require('../clean')(gulp, plugins, options);
  require('../node')(gulp);

  const prebuildTasks = [
    'clean:all',
    'update-node-version'
  ];

  const buildTasks = [
    'sass',
    'createMavenTarGz',
    'copy-assets',
    ...getTranspileTask()
  ];

  gulp.task('build', cb => runSequence(prebuildTasks, buildTasks, handleRunSequenceErrors(cb)));
  gulp.task('start', () => runSequence(prebuildTasks, buildTasks, () => {
    if (process.env.IS_BUILD_AGENT) {
      console.log('spawning npm test')
      spawn('npm', ['test', '--silent'], {stdio: 'inherit'});
    } else {
      spawn('npm', ['test', '--silent'], {stdio: 'inherit'});
    }
  }));
};

function getTranspileTask() {
  const noServerTranspile = isNoServerTranspile();
  if (isTypescriptProject() && !noServerTranspile) {
    return ['typescript'];
  } else if (isBabelProject() && !noServerTranspile) {
    return ['babel'];
  } else {
    return ['no-transpile'];
  }
}
