module.exports = function (wallaby) {
  process.env.NODE_PATH += `:${require('path').join(wallaby.localProjectDir, 'node_modules')}`;
  return {
    files: [
      {pattern: 'src/templates/**', instrument: false},
      {pattern: 'test/**/*.spec.[j|t]s', ignore: true},
      {pattern: 'test/**/*.spec.[j|t]sx', ignore: true},
      {pattern: 'src/**/*.spec.[j|t]s', ignore: true},
      {pattern: 'src/**/*.spec.[j|t]sx', ignore: true},
      {pattern: 'src/assets/**', instrument: false},
      {pattern: 'src/**', instrument: true},
      {pattern: 'target/**/*.json', instrument: false},
      {pattern: 'templates/**', instrument: false},
      {pattern: 'index.js', instrument: true},
      {pattern: 'package.json', instrument: false},
      'test/**/*.[j|t]s',
      'test/**/*.[j|t]sx',
      'src/**/*.scss'
    ],

    tests: [
      {pattern: 'test/**/*.spec.[j|t]s'},
      {pattern: 'test/**/*.spec.[j|t]sx'},
      {pattern: 'src/**/*.spec.[j|t]s'},
      {pattern: 'src/**/*.spec.[j|t]sx'},
    ],

    compilers: {
      '**/*.js*': wallaby.compilers.babel()
    },

    testFramework: 'mocha',

    setup(wallaby) {
      require('babel-polyfill');
      const mocha = wallaby.testFramework;
      mocha.timeout(30000);
      require('wix-node-build/lib/ignore-extensions');
      try {
        require('./test/mocha-setup');
      } catch (e) {
        console.log('warning - no mocha setup file found: test/mocha-setup');
      }
    },

    env: {
      type: 'node',
      params: {
        env: `SRC_PATH=./src;NODE_ENV=test;`
      }
    },
    workers: {
      initial: 1,
      regular: 1
    }
  };
};
