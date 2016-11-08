'use strict';
const karma = require('karma');
const path = require('path');

module.exports = (gulp, plugins) => {
  gulp.task('karma', () => {
    plugins.util.log('Testing with Karma');

    const config = {
      configFile: path.join(__dirname, '..', '..', 'config/karma.conf.js'),
    };

    return new Promise((resolve, reject) => {
      const server = new karma.Server(config, code => {
        code === 0 ? resolve() : reject(code);
        process.exit(code);
      });

      server.start();
    });
  });
};
