'use strict';
const karma = require('karma');
const path = require('path');

module.exports = (gulp, plugins) => {
  gulp.task('karma', () => {
    plugins.util.log('Testing with Karma');
    let config = {
      configFile: path.join(__dirname, '..', '..', 'config/karma.conf.js'),
      singleRun: true
      // frameworks: [utils.testRunner(options)] //Todo: change this to be part of karma.conf.js?
    };
    const keepAlive = true;

    return new Promise((resolve, reject) => {
      const server = new karma.Server(config, code => {
        if (keepAlive && config.singleRun) {
          config = null;
          (code === 0 ? resolve : reject)(code);
        } else {
          process.exit(code);
        }
      });

      if (!config.singleRun && !config.autoWatch) {
        server.once('browsers_ready', () => {
          refresh().then(resolve, reject);
        });
      } else if (!keepAlive) {
        server.once('run_complete', (browsers, results) => {
          const code = results.exitCode;
          (code === 0 ? resolve : reject)(code);
        });
      }

      server.start();
    });

    function refresh() {
      if (config) {
        return new Promise((resolve, reject) => {
          karma.runner.run({port: config.port}, code => {
            (code === 0 ? resolve : reject)(code);
          });
        });
      }
    }
  });
};
