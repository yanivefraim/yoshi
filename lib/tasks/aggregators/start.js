'use strict';

const runSequence = require('run-sequence');
const utils = require('../../utils');
const {startWebpack} = require('../webpack');
const runServer = require('../run-server');

module.exports = (gulp, plugins, options) => {
  // TODO: change gulp tasks to simple async functions
  options = Object.assign(options, {
    done: () => options.server && runServer(gulp, options),
    watch: true
  });

  require('../node')(gulp, plugins, options);
  require('../babel')(gulp, plugins, options);
  require('../typescript')(gulp, plugins, options);
  require('../sass')(gulp, plugins, options);
  require('../mocha')(gulp, plugins, options);
  require('../copy-assets')(gulp, plugins, options);
  require('../clean')(gulp, plugins, options);

  runSequence('clean:all', () => {
    gulp.start(utils.isTypescriptProject() ? 'typescript' : 'babel');

    gulp.start('update-node-version');
    gulp.start('sass');
    gulp.start('copy-assets');

    if (!options.server) {
      gulp.start('mocha');
    }
  });

  startWebpack(options);
};
