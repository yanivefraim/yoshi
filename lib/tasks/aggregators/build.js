'use strict';

const {spawn} = require('child_process');
const runSequence = require('run-sequence');
const {runIndividualTranspiler} = require('../../../config/project');
const {isTypescriptProject, handleRunSequenceErrors, isBabelProject} = require('../../utils');
const petri = require('../petri');

module.exports = (gulp, plugins, options) => {
  require('../targz')(gulp);
  require('../copy-assets')(gulp, plugins, options);
  require('../sass')(gulp, plugins, options);
  require('../typescript')(gulp, plugins, options);
  require('../babel')(gulp, plugins, options);
  require('../no-transpile')(gulp, plugins, options);
  require('../clean')(gulp, plugins, options);
  require('../node')(gulp);

  gulp.task('petri', () => petri.run());

  const prebuildTasks = [
    'clean:all',
    'update-node-version'
  ];

  const buildTasks = [
    'sass',
    'createMavenTarGz',
    'copy-assets',
    getTranspileTask(),
    'petri'
  ];

  gulp.task('build', cb => runSequence(prebuildTasks, buildTasks, handleRunSequenceErrors(cb)));
  gulp.task('start', () => runSequence(prebuildTasks, buildTasks, () => {
    return spawn('npm', ['test', '--silent'], {stdio: 'inherit'});
  }));
};

function getTranspileTask() {
  if (isTypescriptProject() && runIndividualTranspiler()) {
    return 'typescript';
  } else if (isBabelProject() && runIndividualTranspiler()) {
    return 'babel';
  } else {
    return 'no-transpile';
  }
}
