'use strict';

const runSequence = require('run-sequence');

module.exports = (gulp, plugins, options) => {
  require('./build')(gulp, plugins, options);
  require('./test')(gulp, plugins, options);
  require('./lint')(gulp, plugins, options);

  let tasksRunning = false;
  const testRunner = options.mocha ? 'test:mocha' : 'test:jasmine';
  const watchTasks = () => {
    if (!tasksRunning) {
      tasksRunning = true;
      runSequence('lint', 'build', testRunner, () => {
        tasksRunning = false;
        plugins.util.log('Watching...');
      });
    }
  };

  gulp.task('watch', () =>
    plugins.watch(['**/*.+(js|ts)', '!node_modules/**', '!dist/**'], {
      read: false,
      awaitWriteFinish: {
        stabilityThreshold: 100
      }
    }, watchTasks));

  gulp.task('dev', ['watch']);

  // initial run
  watchTasks();
};
