module.exports = function (wallaby) {
  process.env.NODE_PATH += `:${require('path').join(wallaby.localProjectDir, 'node_modules')}`;
  return {
    files: [
      {pattern: 'test/**/*.spec.js*', ignore: true},
      {pattern: 'test/**/*.js'},
      {pattern: 'src/**', instrument: true},
      {pattern: 'src/**/*.spec.js*', ignore: true},
      {pattern: 'target/**/*.json', instrument: false},
      {pattern: 'templates/**', instrument: false},
      {pattern: 'index.js', instrument: true},
      {pattern: 'package.json', instrument: false}
    ],

    tests: [
      {pattern: 'test/**/*.spec.js*'},
      {pattern: 'src/**/*.spec.js*'},
    ],

    compilers: {
      '**/*.js*': wallaby.compilers.babel()
    },

    testFramework: 'mocha',

    setup(wallaby) {

      const mocha = wallaby.testFramework;
      mocha.timeout(30000);

      require.extensions['.scss'] = function () {};
      require.extensions['.css'] = function () {};

      const jsdom = require('jsdom');
      global.document = jsdom.jsdom('<!doctype html><html><body></body></html>');
      global.window = document.defaultView;
      global.navigator = global.window.navigator;
    },

    env: {
      type: 'node',
      params: {
        env: `SRC_PATH=./src;NODE_ENV=test`
      }
    },
    workers: {
      initial: 1,
      regular: 1
    }
  };
};
